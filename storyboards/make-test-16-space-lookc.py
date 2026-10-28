# Remake of test-16-space (batch 4) in look C with the contact rules (CLAUDE.md "Contact and grips").
# Same joke, beats, captions and timing; only spacing, holds, arm routes and blinks change.
# Run: python3 storyboards/make-test-16-space-lookc.py  -> storyboards/test-16-space-lookc.json
import json, copy, pathlib
here = pathlib.Path(__file__).parent
sb = json.loads((here / "test-16-space.json").read_text())
sb["id"] = "test-16-space-lookc"
sb["look"] = "anime-pro"

# 1. spacing (rule 4, 9): the Astronaut's helmet glass reaches 0.53 from his middle, so at +-0.48 it touched the
#    Reaper. +-0.56 leaves a clear gap; every camera aimed at one of them moves with him.
D = 0.08
cast = {c["id"]: c for c in sb["cast"]}
cast["hero"]["at"][0] = -0.56
cast["mag"]["at"][0] = 0.56
def shift(v, dx): v[0] = round(v[0] + dx, 3)
s = sb["shots"]
for k in (0, 3, 5, 6):                      # on the Astronaut
    shift(s[k]["pos"], -D); shift(s[k]["look"], -D)
    if "to" in s[k]:
        shift(s[k]["to"]["pos"], -D)
        if "look" in s[k]["to"]: shift(s[k]["to"]["look"], -D)
shift(s[1]["pos"], D); shift(s[1]["look"], D); shift(s[1]["to"]["pos"], D)   # on the Reaper

# 2. the scythe hold (rule 3): the old "hold" ran the forearm along the shaft all clip. Use the staff hold from
#    Jonny's reference (the Wizard's): fist well out from the side, forearm rising into it, shaft in front.
HOLD = {"o": [0.24, 0.36, 0.08]}
cast["mag"]["arms"]["R"] = HOLD

acts = sb["actions"]
def find(who, at, do): return next(a for a in acts if a["who"] == who and abs(a["at"] - at) < 1e-6 and a["do"] == do)

# 3. "is this enough?" (rule 8): the wave used the scythe hand, which drove the staff into his body (6.2-7.1 s) and
#    the arm through it on the way back (7.1 s). He waves with his free hand instead.
for at in (6, 7): find("mag", at, "arm")["side"] = "L"

# 4. raised arms (rule 4): "up" ran the arms up inside the helmet glass (9.2-13.5 s). They go up in a wide V,
#    out of the glass beside the shoulder; the wave at 12.2 s swings between two wide poses.
UP = {"o": [0.38, 1.12, 0.12]}   # as high as the arm goes while it leaves the glass beside the shoulder
for at in (9.05, 10.85):
    a = find("hero", at, "arm"); a["pose"] = UP; a["dur"] = 0.5   # a little slower, so the hand doesn't snap round (hand-pop)
w = find("hero", 12.2, "arm"); acts.remove(w)
WA, WB = {"o": [0.5, 0.95, 0.15]}, {"o": [0.38, 1.12, 0.12]}
for i, t in enumerate([12.2, 12.5, 12.8, 13.1]):
    acts.append({"who": "hero", "at": t, "do": "arm", "side": "L", "pose": WA if i % 2 == 0 else WB, "dur": 0.28})

# 5. blinks (rule 10): auto blinks landed on "i need some space." (1.0 s), the turn to camera (6.6 s), "no. SPACE
#    space." (10.5 s) and the Reaper's hop (8.7 s). Turn them off and place them between the beats (none in the
#    lift-off payoff).
for a in acts:
    if a["do"] == "look": a["blink"] = False
for who, times in {"hero": [3.8, 5.2, 8.1], "mag": [2.65, 5.3, 9.6, 12.3]}.items():
    acts.append({"who": who, "at": 0, "do": "noblink"})
    for t in times: acts.append({"who": who, "at": t, "do": "blink"})

# 6. the lift-off: the old "hop" (height 3 over 13 s) was rendered before hops got a crouch on the ground first. On
#    today's engine that crouch lasts 2 s (15 % of 13 s), so he squats while the camera tilts up to an empty sky. A
#    steady fly up to the same height the old hop reached at the end (about 2 m at 13.5 s) keeps the old motion.
h = find("hero", 10.8, "hop"); acts.remove(h)
acts.append({"who": "hero", "at": 10.8, "do": "fly", "to": {"y": 1.97}, "dur": 2.7, "ease": "linear"})

acts.sort(key=lambda a: a["at"])
sb["notes"] = "Remake of test-16-space in look C with the contact rules: wider spacing, reference scythe hold, free-hand wave, wide raised arms, blinks off the key lines."
(here / "test-16-space-lookc.json").write_text(json.dumps(sb, indent=2) + "\n")
print("wrote storyboards/test-16-space-lookc.json")
