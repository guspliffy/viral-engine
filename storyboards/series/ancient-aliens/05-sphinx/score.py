#!/usr/bin/env python3
"""Builds assets/music/ancient-aliens/aa05-score.ogg (Egypt EP05 Sphinx debate, 63.6 s) from takes in assets/music/ai.
One score for the whole episode, laid on STORY.md's times; each segment storyboard takes its slice with score(storyTime).
    python3 storyboards/series/ancient-aliens/05-sphinx/score.py
Each part: cut [a, b] from the take, loudness-matched to -18 LUFS, `db` on top, 0.25 s fade in, `out` s fade out.
Claude cannot hear: the takes are chosen by their prompts and the beats; Jonny judges by ear."""
import subprocess, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
AI = os.path.join(ROOT, "assets/music/ai")
OUT = os.path.join(ROOT, "assets/music/ancient-aliens/aa05-score.ogg")
LEN = 63.6
Z2, Z3 = "zombies-score/zombies-score-02.ogg", "zombies-score/zombies-score-03.ogg"
SUS, SW2, SNK, EPIC = "orchestra-suspense/orchestra-suspense-01.ogg", "drama-swell/drama-swell-02.ogg", "sneaky/sneaky-01.ogg", "epic/epic-02.ogg"
#  at     take  a     b      db   out  story
PARTS = [
  (0.0,   Z3,   0,    31.0,   0,  0.5,  "01-12 the pit, the rain claim, the salt answer, the library, the survey: one low string bed with a pulse"),
  (31.0,  SNK,  0,    1.9,   -5,  0.3,  "13 'Yet.' (pizzicato, small)"),
  (32.6,  Z2,   0,    19.0,   0,  0.6,  "14-19 'Then explain the temple': the quarry, the matching layers, Khafre, the unfinished blocks"),
  (51.3,  SUS,  0,    5.0,   -2,  0.4,  "20-21 dusk, Spud's last card"),
  (55.3,  SW2,  0,    6.0,    0,  0.5,  "22-23 the Lion rises in its gaze; she has no answer"),
  (60.6,  EPIC, 0,    3.0,   -3,  0.6,  "24 dawn between the paws"),
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
