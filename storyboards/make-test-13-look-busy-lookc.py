# Remake of test-13-look-busy (batch 4) in look C with the contact rules (CLAUDE.md "Contact and grips").
# Same joke, beats, captions and timing; only spacing, arm routes, the boss's mark, the last framing and blinks change.
# Run: python3 storyboards/make-test-13-look-busy-lookc.py  -> storyboards/test-13-look-busy-lookc.json
import json, pathlib
here = pathlib.Path(__file__).parent
sb = json.loads((here / "test-13-look-busy.json").read_text())
sb["id"] = "test-13-look-busy-lookc"
sb["look"] = "anime-pro"

# 1. spacing (rule 4, 9): at +-0.48 the Samurai's free hand reached into the Sorcerer's hood (3.3-3.6 s, 5.0-5.4 s).
#    +-0.58 leaves room for a free arm out to the side; every camera aimed at one of them moves with him.
D = 0.10
cast = {c["id"]: c for c in sb["cast"]}
cast["hero"]["at"][0] = -0.58
cast["mag"]["at"][0] = 0.58
def shift(v, dx): v[0] = round(v[0] + dx, 3)
s = sb["shots"]
for k in (1, 3):                                   # on the Sorcerer
    shift(s[k]["pos"], D); shift(s[k]["look"], D)
    if "to" in s[k]: shift(s[k]["to"]["pos"], D)
shift(s[4]["pos"], -D); shift(s[4]["look"], -D); shift(s[4]["to"]["pos"], -D)   # close on the Samurai
s[0]["to"]["pos"] = [-0.06, 1.08, 5.45]           # the wider pair: both stay in frame at the new spacing
s[2]["to"] = {"pos": [-0.6, 1.07, 5.4], "look": [-0.62, 0.86, 0]}   # the zap: ends on the Samurai with his sword in frame
# 2. the ending (rule 4): the boss stopped in front of the Samurai at [-1.12, 0.6] and covered half of him from 9.5 s,
#    with the sword hand in the boss's helmet. He stops beside him, clear of the sword, and the shot widens to hold both.
s[5].update({"pos": [-1.42, 1.2, 6.9], "look": [-1.42, 0.88, 0], "fov": 36, "to": {"pos": [-1.42, 1.17, 6.5]}})

acts = sb["actions"]
def find(who, at, do): return next(a for a in acts if a["who"] == who and abs(a["at"] - at) < 1e-6 and a["do"] == do)
find("boss", 9, "move")["to"] = [-2.15, 0.15]

# 3. the flailing (rules 3, 5, 8): the sword hand ran through the old free-hand poses. "hat" put the fist on top of
#    his head with the blade coming out of it, "hips" and "cast" swung the arm through the blade (13 check fails).
#    The sword hand now cycles three sword positions with the blade clear of the arm and the head; the free hand
#    keeps the wild flailing, minus "point" (it reached into the Sorcerer) and "cast" (it covered his own face).
SW = {"up":   ({"o": [0.38, 0.84, 0.16]}, [0, 15]),     # sword raised out to the side, forearm square to the blade
      "high": ({"o": [0.26, 0.95, 0.30]}, [15, 20]),    # raised in front
      "guard": ({"o": [0.22, 0.60, 0.36]}, [35, 5])}    # en garde at the chest
R_MAP = {"up": "up", "wave": "high", "fist": "guard", "hat": "up", "hips": "guard", "cast": "high"}
# open hand out-and-forward: "point" and "shrug" aim the forearm straight out to the side, where the mitten's palm-in
# direction runs along the forearm and the hand flips 140-177 deg in one frame (hand-pop)
PRESENT = {"o": [0.3, 0.6, 0.32]}
# "up" curled the arm over the top of his head; it goes up beside the head instead
L_MAP = {"point": "hips", "cast": {"o": [0.32, 1.0, 0.14]}, "shrug": {"o": [0.28, 0.92, 0.16]}, "up": {"o": [0.2, 1.15, 0.1]}}
extra = []
for a in acts:
    if a["who"] != "hero" or a["do"] != "arm" or a["at"] < 3.1: continue
    if a["side"] == "R":
        k = R_MAP[a["pose"]]
        if a["at"] >= 9 and k == "up": k = "high"    # the ending: the boss stands on the sword side
        pose, tilt = SW[k]
        if a["at"] >= 9: tilt = [tilt[0], min(tilt[1], 5)]
        a["pose"] = pose
        extra.append({"who": "hero", "at": a["at"], "do": "tilt", "to": tilt, "dur": a["dur"]})
    else:
        a["pose"] = L_MAP.get(a["pose"], a["pose"])
acts += extra

# 4. the ask (1.0-1.8 s): both hands pointed at the Sorcerer, the sword hand too, and the free hand flipped 144 deg in
#    one frame. He pleads with the free hand open instead and the sword stays down.
# A low open hand is the only route out of the hanging hand that doesn't flip the mitten (rising past the shoulder
# collapses the forearm, see HANG below), and a smaller turn toward the Sorcerer keeps that hand short of him.
p = find("hero", 0.95, "arm"); p.update({"side": "L", "pose": {"o": [0.12, 0.45, 0.3]}, "dur": 0.3})
find("hero", 0.9, "turn")["to"] = 20
find("hero", 1.8, "arm").update({"side": "L", "dur": 0.4})
# the hanging hand: in "rest" the elbow guide sits further out than the hand, so the forearm is a few centimetres long
# and points inward; the first move out of it swings that short forearm through the palm-in direction and the mitten
# flips (hand-pop 140-177 deg at 1.1, 2.0, 3.4, 6.1 and 11.7 s). A hanging hand a little further out keeps the forearm
# pointing down and out, so the hand turns smoothly into the next pose.
HANG = {"o": [0.15, 0.27, 0.08]}
cast["hero"]["arms"]["L"] = HANG; cast["mag"]["arms"]["R"] = HANG; cast["boss"]["arms"]["R"] = HANG
find("hero", 1.8, "arm")["pose"] = HANG
cast["mag"]["arms"]["R"] = "rest"   # the Sorcerer's spell starts and ends on "rest" (HANG -> fist flips); he lets the
acts.append({"who": "mag", "at": 4.6, "do": "arm", "side": "R", "pose": HANG, "dur": 0.5})   # hand hang out off his shot
# hand pops (> 60 deg in a frame): the Sorcerer's "very busy." and the boss's "promoted." present with an open hand
# instead of "point" (same flip as above), and the spell moves a little slower
find("mag", 5.9, "arm")["pose"] = PRESENT
find("boss", 11.5, "arm")["pose"] = PRESENT
for who, at in (("mag", 2.25), ("mag", 2.3), ("mag", 3), ("mag", 5.9), ("boss", 11.5)):
    for a in acts:
        if a["who"] == who and abs(a["at"] - at) < 1e-6 and a["do"] == "arm": a["dur"] = max(a["dur"], 0.5)

# 5. blinks (rule 10): no automatic blinks on the looks; placed ones between the lines. The slow blink at 8.4 s under
#    "4 hours later" is acting (tired) and stays.
for a in acts:
    if a["do"] == "look": a["blink"] = False
for who, times in {"hero": [2.6, 5.3], "mag": [4.6, 7.2], "boss": [10.5, 12.5]}.items():
    acts.append({"who": who, "at": 0, "do": "noblink"})
    for t in times: acts.append({"who": who, "at": t, "do": "blink"})

acts.sort(key=lambda a: a["at"])
sb["notes"] = "Remake of test-13-look-busy in look C with the contact rules: wider spacing, sword hand on clean sword positions, free hand flails clear of faces, boss stops beside the Samurai, blinks off the key lines."
(here / "test-13-look-busy-lookc.json").write_text(json.dumps(sb, indent=2) + "\n")
print("wrote storyboards/test-13-look-busy-lookc.json")
