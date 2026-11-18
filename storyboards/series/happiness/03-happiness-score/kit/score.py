#!/usr/bin/env python3
"""Builds assets/music/score-film/hs03-score.ogg: ONE score for the whole happiness score film, on story time.
Every block takes its slice with SCORE(T0) from score-kit.mjs (skip = the segment's story start, seam: true), so the
joined segments play one piece without a restart or dip at a seam (Jonny 16 Nov 2026 on the whole-film animatic: the
music at 0:40-0:60 and 1:37-1:42 "is the same but changes": the 13.7 s sad take restarted at each block).
Each library take is used once in a row and never looped across a seam; changes of piece are crossfades on story turns.
The table IS the recipe: if a block's length moves, edit the `at` times and run it again.
    python3 storyboards/series/happiness/03-happiness-score/kit/score.py
Each part: cut [a, b] from the file, `db` on top, `fin` s fade in, `out` s fade out (the library takes sit at -16 LUFS;
the two block beds below were built from them at unity, so no loudness pass)."""
import subprocess, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
AI = os.path.join(ROOT, "assets/music/ai")
SF = os.path.join(ROOT, "assets/music/score-film")
OUT = os.path.join(SF, "hs03-score.ogg")
LEN = 206.0
A_BED = os.path.join(SF, "hs03-a-temp.ogg")          # sneaky-01 x3 (0-40.6) crossfading into sad-02 (from 39.3): Jonny OK by ear
B_BED = os.path.join(SF, "block-b-animatic.ogg")     # block B's bed: the party song (bossa, clear, then muffled from Spud's corner) at 12.6-43.2
D_BED = os.path.join(SF, "hs03-d-temp.ogg")          # block D's bed (sad, drama swell, warm, calm landscape): no note from Jonny
CL = lambda n: os.path.join(AI, f"calm-landscape/calm-landscape-{n:02d}.ogg")
#  at      file                                   a      b      db  fin   out   story
PARTS = [
  (0.0,   A_BED,                                  0.0,   52.6,  0,  0.0,  1.6,  "opening + A: detective plucks, then sad piano from the twist (0:42), one pass, out as B starts"),
  (51.2,  CL(2),                                  0.0,   11.6, -2,  1.2,  0.9,  "B 0:50 mirror, spoon, kettle, puddle: piano + viola, under 'try not to look'"),
  (62.4,  B_BED,                                 12.4,   43.4,  0,  0.2,  0.8,  "B 1:02 the party: their old song (bossa), clear, then muffled from Spud's corner"),
  (92.4,  CL(1),                                  0.0,   28.0, -2,  0.6,  1.5,  "B 1:32 Mash alone on the balcony -> C 1:40 Sunday, the boxes: ONE take across the B/C seam"),
  (119.0, os.path.join(AI, "sad/sad-02.ogg"),     0.0,    7.6, -3,  1.0,  0.6,  "C 1:59 the memory (painted still): sad piano"),
  (126.2, os.path.join(AI, "elegant-reveal/elegant-reveal-02.ogg"), 0.0, 11.4, -2, 0.1, 1.0, "C 2:06 '...was you': felt piano + celesta"),
  (136.6, CL(5),                                  0.0,   13.4, -4,  1.0,  1.8,  "C 2:17 Mash's year, the line about the mind, the van honks; out by 150 (block D starts fresh)"),
  (150.0, D_BED,                                  0.0,   54.0,  0,  0.1,  1.5,  "D 2:30 the last hour, the hill, the colour flood, the sunset (block D's own bed)"),
]


def build():
    cmd, flt, tags = ["ffmpeg", "-v", "error", "-y"], [], []
    for i, (at, f, a, b, db, fin, out, _) in enumerate(PARTS):
        cmd += ["-ss", str(a), "-t", str(round(b - a, 3)), "-i", f]
        d = round(b - a, 3)
        fi = f"afade=t=in:st=0:d={fin}," if fin > 0 else ""
        flt.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={db}dB,{fi}"
                   f"afade=t=out:st={round(d - out, 3)}:d={out},adelay={int(round(at * 1000))}:all=1[p{i}]")
        tags.append(f"[p{i}]")
    flt.append("".join(tags) + f"amix=inputs={len(PARTS)}:normalize=0:dropout_transition=0,apad,atrim=0:{LEN},alimiter=limit=0.89[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "5", OUT]
    subprocess.run(cmd, check=True)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
