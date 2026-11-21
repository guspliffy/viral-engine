#!/usr/bin/env python3
"""Builds assets/music/score-film/lies-score.ogg: ONE score for the whole lie-count film on story time, from library
takes only (no new music: the cheap-film trial). Each act gets a mood; its pool of takes plays in a row with 1.2 s
crossfades and changes piece at the act's turn. Act times come from SEGMENTS.json (make-film.mjs), so after a retime
run make-film, then this.
    python3 storyboards/series/what-if/10-lie-count/score.py"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../.."))
M = os.path.join(ROOT, "assets/music")
OUT = os.path.join(M, "score-film/lies-score.ogg")
ai = lambda k, n: os.path.join(M, f"ai/{k}/{k}-{n:02d}.ogg")
POOLS = {   # (file, from, to, dB)
  "playful": [(os.path.join(M, "score-film/hs03-a-temp.ogg"), 0, 39.5, 0), (ai("elevator-bossa", 1), 0, 10, -2), (os.path.join(M, "skip-remote/skip-remote-score.ogg"), 0, 52, 0),
              (os.path.join(M, "money-redo/money-redo-score.ogg"), 0, 55, 0), (ai("sneaky", 1), 0, 16, 0)],
  "unease": [(ai("orchestra-suspense", 1), 0, 11, -2), (ai("sos-tension", 2), 0, 10, -3), (ai("spooky", 2), 0, 11, -4)],
  "suspense": [(ai("sos-tension", 1), 0, 19, -3), (ai("orchestra-suspense", 1), 0, 11, -2)],
  "drama": [(ai("drama-swell", 1), 0, 10, -3), (ai("sad", 2), 0, 14, -2), (ai("drama-swell", 2), 0, 10, -3)],
  "sad": [(ai("sad", 2), 0, 14, -2), (ai("calm-landscape", 1), 0, 30, -2), (ai("calm-landscape", 2), 0, 30, -2)],
  "unease2": [(ai("calm-landscape", 4), 0, 30, -3), (ai("elegant-reveal", 2), 0, 11, -2), (ai("calm-landscape", 9), 0, 30, -3)],
  "warm": [(ai("sos-warm", 1), 0, 6, -2), (os.path.join(M, "score-film/hs03-d-temp.ogg"), 20, 54, 0), (ai("sos-warm", 2), 0, 6, -2), (ai("calm-landscape", 6), 0, 30, -2)],
  "calm": [(ai("calm-landscape", 5), 0, 30, -2), (ai("calm-landscape", 8), 0, 30, -2)],
}
X = 1.2


def build():
    seg = json.load(open(os.path.join(HERE, "SEGMENTS.json")))
    L = seg["length"]
    starts = [(a["key"], a["mood"], seg["acts"][a["key"]]) for a in seg["actList"] if a["key"] in seg["acts"]]
    parts = []
    for i, (k, mood, a0) in enumerate(starts):
        a1 = starts[i + 1][2] if i + 1 < len(starts) else L
        t, j = a0, 0
        while t < a1 - 0.5:
            f, s0, s1, db = POOLS[mood][j % len(POOLS[mood])]
            d = min(s1 - s0, a1 - t + X)
            parts.append((round(t, 3), f, s0, round(s0 + d, 3), db, X if parts else 0, X))
            t += d - X; j += 1
    cmd, flt, tags = ["ffmpeg", "-v", "error", "-y"], [], []
    for i, (at, f, a, b, db, fin, out) in enumerate(parts):
        d = round(b - a, 3)
        cmd += ["-ss", str(a), "-t", str(d), "-i", f]
        fi = f"afade=t=in:st=0:d={fin}," if fin > 0 else ""
        flt.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={db}dB,{fi}afade=t=out:st={round(max(0, d - out), 3)}:d={out},adelay={int(round(at * 1000))}:all=1[p{i}]")
        tags.append(f"[p{i}]")
    flt.append("".join(tags) + f"amix=inputs={len(parts)}:normalize=0:dropout_transition=0,apad,atrim=0:{L + 1},alimiter=limit=0.89[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "3", OUT]
    subprocess.run(cmd, check=True)
    print("wrote", OUT, f"{len(parts)} parts, {L:.1f} s")


if __name__ == "__main__":
    build()
