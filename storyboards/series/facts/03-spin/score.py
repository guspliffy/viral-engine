#!/usr/bin/env python3
"""Builds assets/music/score-film/spin-score.ogg: one score for the Earth-spins-faster what-if (fact 03) on story time, from
library takes only (recorded-sounding orchestra, Jonny 12 Nov; music from 0.0, changes at the turn, Jonny 11 Nov).
Disaster from frame 0 (the sea wall is already coming, 0-26.7 s), a lighter heroic bed under the fun middle (the lamp bonk,
the dunk, the floating steps, 26.7-43.3), the chase under the danger (gust, post, rain up, 43.3-60), the epic swell in
space (60-76.1); a hard cut on the punchline's end (the clip ends there).
    python3 storyboards/series/facts/03-spin/score.py"""
import os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
M = os.path.abspath(os.path.join(HERE, "../../../../assets/music"))
OUT = os.path.join(M, "score-film/spin-score.ogg")
ai = lambda k, n: os.path.join(M, f"ai/{k}/{k}-{n:02d}.ogg")
L, X = 76.1, 1.0
# (start, end, pool of (file, from, to, dB))
ACTS = [
    (0.0, 26.7, [(ai("disaster", 1), 0, 15, 0), (ai("drama-swell", 1), 0, 10, -1), (ai("disaster", 4), 0, 15, 0)]),
    (26.7, 43.3, [(ai("hero-bed", 1), 0, 8, 0), (ai("hero-bed", 2), 0, 8, 0)]),
    (43.3, 60.0, [(ai("orchestra-chase", 1), 0, 6.4, 0), (ai("disaster", 4), 0, 15, 1), (ai("orchestra-chase", 1), 0, 6.4, 0)]),
    (60.0, L, [(ai("epic", 2), 0, 8, 1), (ai("drama-swell", 2), 0, 10, 1)]),
]
# the bed thins under "Hold on." and before the punchline, so the line lands
DUCKS = [(47.3, 48.2, 0.55), (73.1, 76.1, 0.6)]


def build():
    parts = []
    for a0, a1, pool in ACTS:
        t, j = a0, 0
        while t < a1 - 0.5:
            f, s0, s1, db = pool[j % len(pool)]
            d = min(s1 - s0, a1 - t + (X if a1 < L else 0))
            last = t + d >= a1 - 0.01
            parts.append((round(t, 3), f, s0, round(s0 + d, 3), db, X if t > 0 else 0, 0.04 if (last and a1 >= L) else X))
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
    flt.append("".join(tags) + f"amix=inputs={len(parts)}:normalize=0:dropout_transition=0,apad,atrim=0:{L},{duck},alimiter=limit=0.89[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "3", OUT]
    subprocess.run(cmd, check=True)
    print("wrote", OUT, f"{len(parts)} parts, {L:.1f} s")


if __name__ == "__main__":
    build()
