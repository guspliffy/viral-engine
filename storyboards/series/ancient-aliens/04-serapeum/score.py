#!/usr/bin/env python3
"""Builds assets/music/ancient-aliens/aa04-score.ogg (Egypt EP04 Serapeum redo, 78.2 s) from takes in assets/music/ai.
One score for the whole episode, laid on STORY.md's times; each segment storyboard takes its slice with score(storyTime).
    python3 storyboards/series/ancient-aliens/04-serapeum/score.py
Each part: cut [a, b] from the take, loudness-matched to -18 LUFS, `db` on top, 0.25 s fade in, `out` s fade out.
Claude cannot hear: the takes are chosen by their prompts and the beats; Jonny judges by ear."""
import subprocess, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
AI = os.path.join(ROOT, "assets/music/ai")
OUT = os.path.join(ROOT, "assets/music/ancient-aliens/aa04-score.ogg")
LEN = 78.2
Z1, Z2 = "zombies-score/zombies-score-01.ogg", "zombies-score/zombies-score-02.ogg"
SUS, SW1, SW2, SNK = "orchestra-suspense/orchestra-suspense-01.ogg", "drama-swell/drama-swell-01.ogg", "drama-swell/drama-swell-02.ogg", "sneaky/sneaky-01.ogg"
# REDO 19 Nov (the archaeologist): the same takes on the redo's cut (make-serapeum.mjs prints each segment's story times)
#  at     take  a     b      db   out  story
PARTS = [
  (0.0,   Z1,   2.9,  17.15,  0,  0.25, "00-03 Saqqara, the boxes, the archaeologist steps out (the take from 2.9 s as in v2)"),
  (14.0,  SW1,  0,    4.45,  -1,  0.4,  "04 Memphis: the dead god-bull, strings and choir rise; 70 DAYS"),
  (18.2,  SNK,  0,    3.4,   -4,  0.3,  "05 'But the inside is perfect.' (pizzicato, small)"),
  (24.8,  SNK,  4.0,  5.95,  -5,  0.25, "07 after her answer: the antenna ducks behind a box"),
  (26.5,  SW2,  0,    6.55,   0,  0.3,  "08-09 the alien cutter at the quarry, the barge on the Nile at sunset"),
  (32.8,  Z2,   0,    20.3,   0,  0.6,  "10-15 the staircase: 4, wet sand, 40, the mouth, 8 levers, the jam (pulse building)"),
  (52.8,  SUS,  0,    11.05,  0,  0.4,  "16-19 'Day seventy.' the box is in its niche, aliens tiptoe, 'They did it twenty-four times.'"),
  (63.6,  Z1,   15.4, 27.55, -4,  1.0,  "20-22 the empty box, every box empty, 'someone took them home'"),
  (75.2,  SNK,  0,    3.0,   -4,  0.8,  "23 the end: the box they left, her raised brow"),
]
def build():
    cmd, flt, tags = ["ffmpeg", "-v", "error", "-y"], [], []
    for i, (at, take, a, b, db, out, _) in enumerate(PARTS):
        cmd += ["-ss", str(a), "-t", str(round(b - a, 3)), "-i", os.path.join(AI, take)]
        d = b - a
        flt.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-18:TP=-2:LRA=11,volume={db}dB,"
                   f"afade=t=in:st=0:d=0.25,afade=t=out:st={round(d - out, 3)}:d={out},adelay={int(at * 1000)}:all=1[p{i}]")
        tags.append(f"[p{i}]")
    flt.append("".join(tags) + f"amix=inputs={len(PARTS)}:normalize=0:dropout_transition=0,apad,atrim=0:{LEN},alimiter=limit=0.89[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "5", OUT]
    subprocess.run(cmd, check=True)
    print("wrote", OUT)
if __name__ == "__main__":
    build()
