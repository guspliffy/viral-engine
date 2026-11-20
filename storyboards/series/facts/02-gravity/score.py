#!/usr/bin/env python3
"""Builds assets/music/score-film/gravity-score.ogg: one score for the gravity what-if on story time, from library takes
only (recorded-sounding orchestra, Jonny 12 Nov; dramatic, a bit loud, Jonny 19 Nov on the Mona Lisa). Dread under the
body steps (0-13 s), a disaster/chase run under the world ladder (13-60.5 s), dead silence on the blackout (60.5-61.5),
nothing under the 1 g reset (room tone only), so the loop re-enters on the dread at frame 0.
    python3 storyboards/series/facts/02-gravity/score.py"""
import os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
M = os.path.abspath(os.path.join(HERE, "../../../../assets/music"))
OUT = os.path.join(M, "score-film/gravity-score.ogg")
ai = lambda k, n: os.path.join(M, f"ai/{k}/{k}-{n:02d}.ogg")
L, X = 64.0, 1.2
# (start, end, pool of (file, from, to, dB))
ACTS = [
    (0.0, 13.0, [(ai("orchestra-suspense", 1), 0, 11, 2), (ai("drama-swell", 1), 0, 10, -1)]),
    (13.0, 60.5, [(ai("orchestra-chase", 1), 0, 6.4, 0), (ai("disaster", 1), 0, 15, 0), (ai("drama-swell", 2), 0, 10, 0), (ai("disaster", 4), 0, 15, 1)]),
]
# the bed drops under the tunnel (his pulse carries it) and lets each world line land
DUCKS = [(10.0, 13.0, 0.35)]


def build():
    parts = []
    for a0, a1, pool in ACTS:
        t, j = a0, 0
        while t < a1 - 0.5:
            f, s0, s1, db = pool[j % len(pool)]
            d = min(s1 - s0, a1 - t + (X if a1 < 60 else 0))
            last = t + d >= a1 - 0.01
            parts.append((round(t, 3), f, s0, round(s0 + d, 3), db, X if t > 0 else 0, 0.04 if (last and a1 >= 60) else X))
            if last: break
            t += d - X; j += 1
    cmd, flt, tags = ["ffmpeg", "-v", "error", "-y"], [], []
    for i, (at, f, a, b, db, fin, out) in enumerate(parts):
        d = round(b - a, 3)
        cmd += ["-ss", str(a), "-t", str(d), "-i", f]
        fi = f"afade=t=in:st=0:d={fin}," if fin > 0 else ""
        flt.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={db}dB,{fi}afade=t=out:st={round(max(0, d - out), 3)}:d={out},adelay={int(round(at * 1000))}:all=1[p{i}]")
        tags.append(f"[p{i}]")
    duck = ",".join(f"volume=enable='between(t,{a},{b})':volume={g}" for a, b, g in DUCKS)
    flt.append("".join(tags) + f"amix=inputs={len(parts)}:normalize=0:dropout_transition=0,apad,atrim=0:{L},{duck},volume=enable='gte(t,60.5)':volume=0,alimiter=limit=0.89[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "3", OUT]
    subprocess.run(cmd, check=True)
    print("wrote", OUT, f"{len(parts)} parts, {L:.1f} s")


if __name__ == "__main__":
    build()
