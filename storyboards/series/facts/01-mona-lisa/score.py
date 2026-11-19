#!/usr/bin/env python3
"""Builds assets/music/score-film/monalisa-score.ogg: ONE score for the whole Mona Lisa fact story on story time, from
library takes only (recorded-sounding orchestra for the heist and the panic, Jonny 12 Nov). Each act gets a mood; its pool of takes plays in a row with 1.2 s
crossfades and changes piece at the act's turn. Act times come from SEGMENTS.json (make-film.mjs), so after a retime
run make-film, then this.
    python3 storyboards/series/facts/01-mona-lisa/score.py"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../.."))
M = os.path.join(ROOT, "assets/music")
OUT = os.path.join(M, "score-film/monalisa-score.ogg")
ai = lambda k, n: os.path.join(M, f"ai/{k}/{k}-{n:02d}.ogg")
POOLS = {   # (file, from, to, dB). Jonny 19 Nov 14:54: "more dramatic and a bit louder music": all orchestra now (the
  # soft piano reveal, the cartoon pizzicato and the synth-bass tension take are out), dread under the theft, a chase
  # and a disaster bed under the panic and the arrest, the big choir swell for today
  "mystery": [(ai("orchestra-suspense", 1), 0, 11, 2), (ai("drama-swell", 1), 0, 10, -1)],
  "sneaky": [(ai("zombies-score", 3), 0, 14, -1), (ai("orchestra-suspense", 1), 0, 11, 2)],
  "suspense": [(ai("orchestra-suspense", 1), 0, 11, 2), (ai("zombies-score", 3), 0, 14, -1)],
  "drama": [(ai("orchestra-chase", 1), 0, 6.4, 0), (ai("disaster", 1), 0, 15, 0), (ai("drama-swell", 2), 0, 10, 0)],
  "reveal": [(ai("drama-swell", 1), 0, 10, 0), (ai("hero-bed", 1), 0, 8, -2)],
  "heroic": [(ai("hero-bed", 1), 0, 8, 0)],
}
# Sol's music plan (sol-check/SOL-MUSIC.md), the parts Jonny's "more dramatic" keeps, on story time (1.1x video = /1.1):
# the panic act holds suspense until the alarm, the chase starts on "...panic."; Italy's cheers get the brass phrase
MOOD = {"panic": "suspense"}
SPLITS = [("alarm", "drama", 47.197), ("cheer", "heroic", 77.504)]   # story times after the queue opening (19 Nov)
# a single low orchestral hit after "the knob is gone" (orchestra-chase's timpani-and-piano hit at 3.15 s)
HITS = [(31.247, ai("orchestra-chase", 1), 3.15, 1.3, 3)]
# (from, to, gain): the bed drops under the plumber's door so the hit lands, and "He gets seven months." lands dry
DUCKS = [(28.297, 31.197, 0.45), (31.197, 34.497, 0.3), (79.254, 81.004, 0.12)]
X = 1.2


def build():
    seg = json.load(open(os.path.join(HERE, "SEGMENTS.json")))
    L = seg["length"]
    starts = [(a["key"], MOOD.get(a["key"], a["mood"]), seg["acts"][a["key"]]) for a in seg["actList"] if a["key"] in seg["acts"]]
    starts = sorted(starts + [x for x in SPLITS if x[2] < L], key=lambda x: x[2])
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
    n = len(parts)
    for j, (at, f, a, d, db) in enumerate(HITS):
        cmd += ["-ss", str(a), "-t", str(d), "-i", f]
        flt.append(f"[{n + j}:a]aresample=48000,aformat=channel_layouts=stereo,volume={db}dB,afade=t=out:st={round(d * 0.4, 3)}:d={round(d * 0.6, 3)},adelay={int(round(at * 1000))}:all=1[h{j}]")
    duck = ",".join(f"volume=enable='between(t,{a},{b})':volume={g}" for a, b, g in DUCKS)
    flt.append("".join(tags) + f"amix=inputs={n}:normalize=0:dropout_transition=0,apad,atrim=0:{L + 1},{duck}[bed]")
    flt.append("[bed]" + "".join(f"[h{j}]" for j in range(len(HITS))) + f"amix=inputs={1 + len(HITS)}:normalize=0:dropout_transition=0,atrim=0:{L + 1},alimiter=limit=0.89[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "3", OUT]
    subprocess.run(cmd, check=True)
    print("wrote", OUT, f"{len(parts)} parts, {L:.1f} s")


if __name__ == "__main__":
    build()
