# Builds money-happy-score.ogg from library takes (assets/music/ai, see its manifest), one take per scene.
# python3 assets/music/money-happy/make-score.py   (ffmpeg; deterministic)
import subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); AI = os.path.join(H, "..", "ai")
# (clip start s, take, take from s, length s, gain, fade in s, fade out s)
PARTS = [
    (0.00, "sad/sad-02.ogg", 0.0, 4.2, 1.0, 0.0, 0.5),                    # cold open: rich, sad, rain
    (3.80, "elegant-reveal/elegant-reveal-02.ogg", 0.0, 5.6, 0.85, 0.3, 0.4),  # the city of happy rich potatoes
    (9.05, "orchestra-chase/orchestra-chase-01.ogg", 0.0, 5.7, 1.0, 0.05, 0.5),  # the heist and the escape
    (14.45, "hero-bed/hero-bed-01.ogg", 0.0, 3.4, 0.95, 0.05, 0.5),       # he buys everything
    (17.55, "orchestra-suspense/orchestra-suspense-01.ogg", 0.0, 8.0, 1.0, 0.1, 0.6),  # the siren, the locks, 3:00
    (25.15, "sad/sad-02.ogg", 4.2, 3.1, 1.0, 0.3, 0.4),                   # alone at the long table
    (27.95, "disaster/disaster-01.ogg", 0.0, 2.8, 0.9, 0.05, 0.4),        # the siren at the gate, he flees
    (30.45, "zombies-score/zombies-score-01.ogg", 0.0, 7.0, 0.8, 0.2, 0.8),  # the dry car, the climb, the ambulance
    (36.80, "drama-swell/drama-swell-01.ogg", 0.0, 10.0, 1.0, 0.4, 1.6),  # the clouds break, the sunset, the smile
    (45.20, "calm-landscape/calm-landscape-01.ogg", 0.0, 2.8, 0.7, 1.2, 0.0),   # the hold: it settles into calm  # the clouds break, the sunset, the smile
]
END = 48.0
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
