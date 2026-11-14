#!/usr/bin/env python3
"""Builds assets/music/ancient-aliens/aa02-score.ogg (EP02 Stonehenge, 208 s) from takes in assets/music/ai.
One score for the whole film, laid on STORY.md's times; a block takes its slice with score(storyTime) (kit/sh-kit.mjs).
The table below IS the recipe: if a block's length moves, the join pass edits the `at` times and runs this again.
    python3 storyboards/series/ancient-aliens/02-stonehenge/kit/score.py
Each part: cut [a, b] from the take, loudness-matched to -18 LUFS, `db` on top, 0.25 s fade in, `out` s fade out."""
import subprocess, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
AI = os.path.join(ROOT, "assets/music/ai")
OUT = os.path.join(ROOT, "assets/music/ancient-aliens/aa02-score.ogg")
LEN = 208.0
Z1, Z2 = "zombies-score/zombies-score-01.ogg", "zombies-score/zombies-score-02.ogg"
SUS, SW1, SW2 = "orchestra-suspense/orchestra-suspense-01.ogg", "drama-swell/drama-swell-01.ogg", "drama-swell/drama-swell-02.ogg"
#  at     take   a     b      db   out  story
PARTS = [
  (0.0,   Z1,    0,    11.25,  0,  0.25, "A hook: the stone hangs, drops; the ring; snap to today (the series theme: low strings, sparse piano, timpani pulse)"),
  (11.0,  SUS,   0,    10.25,  0,  0.25, "A contract: five clues, the shortest day, the sunset clock starts"),
  (21.0,  SW1,   0,    8.25,   0,  0.25, "A clue 1: the crane up the nine-metre stone, the pit (strings and choir rise)"),
  (29.0,  SUS,   0,    9.25,   0,  0.25, "A the push, two buses, the 25 km line"),
  (38.0,  "hero-bed/hero-bed-01.ogg", 0, 7.25, -2, 0.25, "A the time-lapse: thud, thud, thud, the ring grows (brass, driving strings)"),
  (45.0,  SUS,   0,    4.6,    0,  1.6,  "A the turn: 'the small ones are'; out by 49.6 so the knock at 50 rings alone"),
  (54.0,  Z2,    0,    14.25,  0,  0.25, "B clue 2: the bluestones, the line runs to Wales"),
  (68.0,  SW2,   0,    9.25,   0,  0.25, "B Wales: the crag, the cargo ship over the hills"),
  (77.0,  SUS,   0,    11.0,   0,  0.25, "B the twist: the Altar Stone, 'it is not from Wales'"),
  (88.0,  SW1,   4.0,  10.0,   0,  2.0,  "B 240 -> 750 km up the whole island; rings out under 'Nobody knows how'"),
  (95.0,  SUS,   0,    5.0,   -3,  2.5,  "B low under the ask; out by 100 ('I'll wait': only the sheep)"),
  (102.0, Z1,    0,    18.9,   0,  0.25, "C clue 3: knobs and holes, the ring closes (the theme returns)"),
  (120.7, SUS,   0,    10.5,   0,  0.25, "C the slope and the level ring; the ship the same size as the ring"),
  (131.0, SW1,   0,    3.2,   -2,  0.25, "C 'why would a temple need to be perfectly level?'"),
  (134.0, Z2,    0,    5.25,   0,  0.25, "C clue 4: one line"),
  (139.0, SW2,   0,    7.25,   0,  0.5,  "C the two suns: 21 JUN, 21 DEC"),
  (146.0, "sneaky/sneaky-01.ogg", 0, 10.0, -5, 0.6, "C the grooves: the alien caught with the cutter (pizzicato, bassoon, small)"),
  (156.0, "calm-landscape/calm-landscape-09.ogg", 0, 15.25, -3, 0.25, "D clue 5: the parchment, giants over the sea (slow piano, harp, warm violins)"),
  (171.0, "calm-landscape/calm-landscape-06.ogg", 0, 6.0, -4, 1.8, "D the low: he sits, the sheep; out by 177: the last three seconds of the countdown are wind only"),
  (180.0, "sos-warm/sos-warm-01.ogg", 0, 6.5, -2, 1.5, "D the sun in the gap, the red shaft (warm strings and choir, full from the first note)"),
  (183.0, SW1,   0,    8.0,    1,  0.4,  "D the ring ship comes down the line and settles: the swell peaks on the clunk at 190.5"),
  (191.0, SUS,   0,    5.4,   -4,  0.3,  "D 'thirty metres across... never a temple'; cut dead before 'It's a parking space.'"),
  (198.3, SW1,   5.5,  9.0,    1,  2.0,  "D 'Case closed': rings out by 202"),
  (200.6, "sneaky/sneaky-01.ogg", 0, 7.4, -5, 1.2, "D the tag: twenty workers drag a stone past"),
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
def table():
    print("| from (s) | take | part | story |\n|---|---|---|---|")
    for at, take, a, b, db, out, story in PARTS:
        extra = (f", {db:+d} dB" if db else "") + (f", {out} s fade" if out > 0.5 else "")
        print(f"| {at} | ai/{take} | {a}-{b}{extra} | {story} |")
if __name__ == "__main__":
    table() if "--table" in sys.argv else build()
