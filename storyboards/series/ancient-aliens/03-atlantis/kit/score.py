#!/usr/bin/env python3
"""Builds assets/music/ancient-aliens/aa03-score.ogg (EP03 Atlantis, 204 s) from takes in assets/music/ai.
One score for the whole film, laid on STORY.md's times; a block takes its slice with score(storyTime) (kit/at-kit.mjs).
The table below IS the recipe: if a block's length moves, the join pass edits the `at` times and runs this again.
    python3 storyboards/series/ancient-aliens/03-atlantis/kit/score.py            (the film's score, then the part scores)
    python3 storyboards/series/ancient-aliens/03-atlantis/kit/score.py --parts    (only aa03-part-{b,c,d}.ogg: hook bed + the block's slice)
Each part: cut [a, b] from the take, loudness-matched to -18 LUFS, `db` on top, 0.25 s fade in, `out` s fade out."""
import subprocess, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
AI = os.path.join(ROOT, "assets/music/ai")
OUT = os.path.join(ROOT, "assets/music/ancient-aliens/aa03-score.ogg")
LEN = 200.0
Z1, Z2 = "zombies-score/zombies-score-01.ogg", "zombies-score/zombies-score-02.ogg"
SUS, SW1, SW2 = "orchestra-suspense/orchestra-suspense-01.ogg", "drama-swell/drama-swell-01.ogg", "drama-swell/drama-swell-02.ogg"
#  at     take   a     b      db   out  story
CALM, CALM2, WARM, DIS = "calm-landscape/calm-landscape-01.ogg", "calm-landscape/calm-landscape-08.ogg", "sos-warm/sos-warm-01.ogg", "disaster/disaster-01.ogg"
PARTS = [
  (0.0,   SW1,   0,    9.25,   0,  0.25, "A hook: the ring city at dawn, the wall flashes, 'Gone in one day' (strings and choir from the first note)"),
  (9.0,   Z1,    0,    13.25,  0,  0.25, "A snap to today's empty sea; Plato's scroll, five clues, the clock starts (the series theme)"),
  (22.0,  SUS,   0,    6.25,   0,  0.25, "A clue 1: the rings draw themselves"),
  (28.0,  SW2,   0,    8.25,  -1,  0.25, "A the canal 30 m deep, deeper than Suez"),
  (36.0,  "hero-bed/hero-bed-01.ogg", 0, 8.25, -3, 0.25, "A the walls: brass, tin, the red metal (brass, driving strings)"),
  (44.0,  SUS,   0,    5.6,    0,  1.6,  "A the turn: 'nobody has found one stone'; out by 49.6 so the headlamp click at 50 stands alone"),
  (54.0,  Z2,    0,    13.25,  0,  0.25, "B clue 2: the wreck, 39 bars, orichalcum, the noon wall plate (63.9) [block B timeline 15 Nov]"),
  (67.0,  CALM,  0,    10.25, -3,  0.25, "B the map west through Gibraltar (67), the bridge at noon (74)"),
  (76.9,  DIS,   0,    4.55,  -2,  0.5,  "B the first quake: the hit at 77.05, the column falls, they turn (78.7)"),
  (81.2,  SUS,   0,    11.0,  -2,  2.5,  "B the deep Atlantic (81.2), low under the ask (88); out by 92.2 ('I'll wait' at 94: only the fish)"),
  (98.0, CALM2, 0,    14.55, -2,  0.25, "C part hook + clue 3: Bimini, the 1940 page, the island (pastoral, light) [block C timeline 15 Nov]"),
  (112.3, Z1,    0,    11.75,  0,  0.25, "C 'divers found this': the road, 800 m; evening in Atlantis, the foreman counts Spud in"),
  (123.8, SUS,   0,    5.15,  -3,  0.25, "C 'natural beachrock', a fish passes"),
  (128.7, SW1,   0,    5.05,  -2,  0.25, "C the real question: can a city sink in one day?"),
  (133.5, "sneaky/sneaky-01.ogg", 0, 6.05, -5, 0.6, "C the step: 3 mm a year, he waits (pizzicato, small)"),
  (139.3, DIS,   0,    7.75,   0,  0.5,  "C Port Royal 1692: two thirds in two minutes; the slide hit at 146.6"),
  (146.8, SUS,   0,    3.4,   -3,  1.4,  "C 'Closer. But that was one town.'"),
  (150.0, Z2,    0,    12.25,  0,  0.25, "D 373 BC, Helike floods; Plato was alive"),
  (162.0, SW2,   0,    6.25,   0,  0.5,  "D Atlantis outline the size of a continent"),
  (168.0, "calm-landscape/calm-landscape-06.ogg", 0, 5.5, -4, 1.8, "D the low: only his head in the black sea; out by 177.5, the last second is sea only"),
  (174.0, SW1,   0,    10.0,   1,  0.4,  "D midnight: the city rises, water pours off, the beam (swell peaks at the reveal)"),
  (184.0, WARM,  0,    6.5,   -2,  1.5,  "D the last seat: he steps out of the beam (warm strings and choir, small)"),
  (190.5, SW2,   5.0,  9.0,   -3,  2.0,  "D 'Somebody had to tell you.' 'Case closed.': the ring of lights rises away"),
  (194.5, "sneaky/sneaky-01.ogg", 0, 5.5, -5, 1.0, "D the tag: Plato winks"),
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
# THE VERTICAL PARTS (Jonny 14 Nov: every short needs its own hook, a part without one performed worse). Parts 2-4 open on
# a hook shot of HOOK seconds that the film does not have; each gets its own file: a hook bed (the first seconds of a take,
# full from its first note) and then the film's score from the block's start, so every hit stays where the block has it.
#        block start  end    hook bed (take, dB)
HOOK = 3.0
HOOKS = {
    "b": (50.0, 98.0, Z2, 0, 2.6),                       # the bar flashes in the headlamp: block B's own first shot IS the hook (2.6 s, in the block)
    "c": (98.0, 150.0, CALM2, -2),                       # the stone road under clear water
    "d": (150.0, 200.0, DIS, -2),                         # Helike: the sea over the roofs at night
}
def parts():
    for k, (t0, t1, take, db, *inb) in HOOKS.items():
        if inb:   # the hook is the block's own first shot: the bed plays over block time 0..h, then the film's score from t0 + h; part time = block time
            h = inb[0]
            out = os.path.join(os.path.dirname(OUT), f"aa03-part-{k}.ogg")
            flt = (f"[0:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-18:TP=-2:LRA=11,volume={db}dB,"
                   f"afade=t=in:st=0:d=0.05,afade=t=out:st={h - 0.35}:d=0.6[h];"
                   f"[1:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(h * 1000)}:all=1[m];"
                   f"[h][m]amix=inputs=2:normalize=0:dropout_transition=0,apad,atrim=0:{t1 - t0},alimiter=limit=0.89[o]")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0", "-t", str(h + 0.25), "-i", os.path.join(AI, take),
                            "-ss", str(t0 + h), "-t", str(t1 - t0 - h), "-i", OUT, "-filter_complex", flt, "-map", "[o]",
                            "-ar", "48000", "-c:a", "libvorbis", "-q:a", "5", out], check=True)
            print("wrote", out, "(hook in the block)")
            continue
        out = os.path.join(os.path.dirname(OUT), f"aa03-part-{k}.ogg")
        flt = (f"[0:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-18:TP=-2:LRA=11,volume={db}dB,"
               f"afade=t=in:st=0:d=0.05,afade=t=out:st={HOOK - 0.35}:d=0.6[h];"
               f"[1:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(HOOK * 1000)}:all=1[m];"
               f"[h][m]amix=inputs=2:normalize=0:dropout_transition=0,apad,atrim=0:{HOOK + t1 - t0},alimiter=limit=0.89[o]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0", "-t", str(HOOK + 0.25), "-i", os.path.join(AI, take),
                        "-ss", str(t0), "-t", str(t1 - t0), "-i", OUT, "-filter_complex", flt, "-map", "[o]",
                        "-ar", "48000", "-c:a", "libvorbis", "-q:a", "5", out], check=True)
        print("wrote", out)
def table():
    print("| from (s) | take | part | story |\n|---|---|---|---|")
    for at, take, a, b, db, out, story in PARTS:
        extra = (f", {db:+d} dB" if db else "") + (f", {out} s fade" if out > 0.5 else "")
        print(f"| {at} | ai/{take} | {a}-{b}{extra} | {story} |")
if __name__ == "__main__":
    if "--table" in sys.argv: table()
    elif "--parts" in sys.argv: parts()
    else: build(); parts()
