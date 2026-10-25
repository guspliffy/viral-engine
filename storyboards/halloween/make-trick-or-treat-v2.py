# Trick or treat v2 (Jonny's brief "Samurai versus Toilet Paper", 25 Oct 2026): two minis knock on a stone cottage's
# arched door, the Wizard tips a sweet into each bag and shuts the door, they knock again and he says "Again?" and shuts
# it firmly, so they throw a toilet roll each at the house. The Samurai steps out (steel katana, this clip only), his
# eyes find the rolls, the camera runs along the blade to a glint, he cuts one roll in the open and the second in a
# macro close-up, four halves land, the minis realise and run. 12 shots with hard cuts (sb.shots), no loop.
#
# Slow motion lives in the rolls' clock (WARP): real time for the throw, almost frozen from 9 s, slow for the cuts, real
# time again for the halves landing. The sheet on each roll flutters on the same clock (prop `sway`).
#
# Run: python3 storyboards/halloween/make-trick-or-treat-v2.py  -> storyboards/halloween/trick-or-treat-v2.json
# The candy, the throws, the cuts and the close cameras are aimed from the last layout
# (out/trick-or-treat-v2-anime-pro.layout.json), so after changing poses run --layout, this script, then --layout again.
import json, math, pathlib

here = pathlib.Path(__file__).parent
root = here.parent.parent
ID = "trick-or-treat-v2"
LAYOUT = root / "out" / f"{ID}-anime-pro.layout.json"
lay = None
if LAYOUT.exists():
    try:
        lay = json.loads(LAYOUT.read_text())
    except Exception:
        lay = None

FPS = 30
items = []          # (absolute time, item)


def at(t, **it):
    items.append((round(t, 3), it))


def act(t, who, do, **kw):
    at(t, who=who, do=do, **kw)


def prop(t, pid, dur, ease="inOut", **st):
    at(t, do="prop", id=pid, dur=dur, ease=ease, set=st)


def sfx(t, sound, gain=0.4, **kw):
    at(t, sfx=sound, gain=gain, **kw)


def say(t, who, line, tone="excited", caption=True, **kw):
    at(t, macro="say", who=who, line=line, tone=tone, caption=caption, **kw)


def cap(t, text, length, **kw):
    at(t, caption=text, len=length, **kw)


# ---------------------------------------------------------------- shots (hard cuts)
S = {"knock": 0.0, "sweets": 1.2, "again": 4.2, "prank": 7.0, "samurai": 9.0, "eyes": 10.2, "blade": 11.2,
     "cut1": 13.0, "cut2": 14.4, "follow": 16.0, "realize": 17.6, "run": 18.8}
END = 22.0

# ---------------------------------------------------------------- places (set-cottage.js COTTAGE)
HINGE = [0.53, -0.81]            # the door's hinge (right side of the doorway), swinging into the house
DOOR_W = 1.06
WIZ_IN = [-0.30, -2.05]          # behind the door, clear of its swing
WIZ_SERVE = [-0.05, -0.95]       # in the doorway
SAM_DOOR = [-0.05, -1.05]
SAM_OUT = [-0.05, -0.30]
A_KNOCK, B_KNOCK = [0.14, -0.45], [-0.32, -0.08]
A_SERVE, B_SERVE = [0.30, -0.10], [-0.36, -0.02]
A_THROW, B_THROW = [0.36, 1.38], [-0.36, 1.50]
BAG_A_GROUND, BAG_B_GROUND = [0.66, 1.42], [-0.66, 1.54]
WIZ_BEHIND = [0.20, -2.20]       # where the Wizard waits while the Samurai takes the doorway (clear of the door's swing)
A_FLEE, B_FLEE = [2.6, 6.5], [-0.9, 6.8]      # either side of the camera, well clear of the lens

# poses (character space: o = [out, up, forward]; the minis are cast at scale 0.45)
BAG_HOLD = {"o": [0.16, 0.24, 0.06]}
REST = {"o": [0.2, 0.18, 0.02]}
BAG_UP = {"o": [-0.06, 0.50, 0.42]}
KNOCK_IN = {"world": [0.27, 0.33, -0.745]}       # knuckles on the planks (the door's face is at z -0.78)
KNOCK_OUT = {"world": [0.29, 0.34, -0.64]}
THROW_BACK = {"o": [0.16, 0.26, -0.10]}
THROW_UP = {"o": [0.04, 0.80, 0.34]}
BOWL = {"o": [-0.16, 0.16, 0.44]}
BOWL_OUT = {"o": [-0.32, 0.18, 0.46]}
# the Samurai's sword arm: each pose with its blade tilt [forward, outward]
SAM_LOW, SAM_LOW_T = {"o": [0.12, 0.12, 0.25]}, [120, -30]     # held low at his right hip, tip down and forward
GUARD, GUARD_T = {"o": [0.06, 0.38, 0.45]}, [0, -10]           # upright at his right shoulder, hilt at the chest
ACROSS, ACROSS_T = {"o": [-0.35, 0.30, 0.55]}, [70, -60]       # the first cut ends low across to his left
RISE, RISE_T = {"o": [0.06, 0.45, 0.38]}, [-5, 15]             # the second cut rises back up to his right
FINISH, FINISH_T = {"o": [0.18, 0.06, 0.28]}, [150, -60]       # the finish: blade down and back at his right
SAM_FREE = {"o": [-0.08, 0.10, 0.06]}     # the free hand low by the sash

ROLL_S = 0.6
BAG_SIDE = {"a": "L", "b": "L"}
KNOCK_SIDE = "R"                 # A knocks with the right hand (the camera side), the bag in the left
THROW_SIDE = {"a": "R", "b": "L"}
cast = [
    {"id": "wiz", "character": "halloween/wizard-host", "at": WIZ_IN[:], "face": "camera", "expr": "kind",
     "arms": {"L": BOWL}, "grip": {"L": "cup"}},
    {"id": "sam", "character": "halloween/samurai-steel", "at": [0.25, -2.6], "face": "camera", "expr": "focused",
     "arms": {"R": SAM_LOW, "L": SAM_FREE}},
    {"id": "a", "character": "halloween/mini-vampire", "at": A_KNOCK[:], "face": 180, "scale": 0.45, "expr": "eager"},
    {"id": "b", "character": "halloween/mini-pumpkin", "at": B_KNOCK[:], "face": 195, "scale": 0.45, "expr": "kind"},
]
props = [
    {"id": "door", "kind": "archdoor", "x": HINGE[0], "y": 0, "z": HINGE[1], "w": DOOR_W, "h": 2.05, "angle": 90, "open": 0, "scenery": True},
    {"id": "bowl", "kind": "bowl", "style": "wood", "x": 0, "y": 0, "z": -2.5},
    {"id": "candyA", "kind": "candy", "x": 0, "y": 0, "z": -2.5, "scale": 0, "color": "#e8b53a"},
    {"id": "candyB", "kind": "candy", "x": 0, "y": 0, "z": -2.5, "scale": 0, "color": "#d9443a"},
    {"id": "bagA", "kind": "treatbag", "style": "bat", "x": 0, "y": 0, "z": 0},
    {"id": "bagB", "kind": "treatbag", "style": "pumpkin", "x": 0, "y": 0, "z": 0},
    {"id": "rollA", "kind": "tproll", "scale": 0, "x": 0, "y": 0, "z": 0, "phase": 0.0, "tail": 0.5, "layers": 9},
    {"id": "rollB", "kind": "tproll", "scale": 0, "x": 0, "y": 0, "z": 0, "phase": 2.1, "tail": 0.5, "layers": 9},
]

# ---------------------------------------------------------------- setup
for who in ("wiz", "sam", "a", "b"):
    act(0, who, "noblink")
act(0, "sam", "hide")
act(0, "wiz", "grab", prop="bowl", hand="L", grip="base", off=[0, 0.035, 0], pose=None)
# A (right) knocks with the right hand and holds the bag in the left; B (left, a step back) holds it in the left
act(0, "a", "grab", prop="bagA", hand="L", grip="handles", pose=None)
act(0, "b", "grab", prop="bagB", hand="L", grip="handles", pose=None)
act(0, "a", "arm", side="L", pose=BAG_HOLD, dur=0.01)
act(0, "a", "arm", side="R", pose=KNOCK_OUT, dur=0.01)
act(0, "b", "arm", side="L", pose=BAG_HOLD, dur=0.01)

# ---------------------------------------------------------------- 01 knock (0-1.2): the fist already on its way
act(0, "a", "look", to=[0, 0.25], dur=0.1, blink=False)
act(0, "b", "look", to=[-0.2, 0.3], dur=0.1, blink=False)
for t in (0.0, 0.32):
    act(t, "a", "arm", side=KNOCK_SIDE, pose=KNOCK_IN, dur=0.1, ease="linear")
    act(t + 0.1, "a", "arm", side=KNOCK_SIDE, pose=KNOCK_OUT, dur=0.12, ease="out")
    sfx(t + 0.1, "knock", 0.6)
act(0.6, "a", "arm", side=KNOCK_SIDE, pose=REST, dur=0.25)
say(0.62, "a", "Trick or treat!", tone="excited", caption=False)
say(0.66, "b", "Trick or treat!", tone="excited", caption=False)
cap(0.62, "Trick or treat!", 0.53)
for k, d in (("a", 0.0), ("b", 0.04)):
    act(0.66 + d, k, "hop", height=0.04, dur=0.26)
    act(0.62 + d, k, "expr", expr="delighted", dur=0.12)
# a step back from the door, bags up (finishes behind the cut)
act(1.05, "a", "move", to=A_SERVE, dur=0.35, ease="inOut")
act(1.08, "b", "move", to=B_SERVE, dur=0.35, ease="inOut")

# ---------------------------------------------------------------- 02 sweets (1.2-4.2)
prop(1.3, "door", 0.55, ease="out", open=1)
sfx(1.3, "creak", 0.22, dur=0.5)
act(1.75, "wiz", "move", to=WIZ_SERVE, dur=0.55, ease="inOut")
sfx(2.25, "step", 0.25)
act(1.9, "wiz", "expr", expr="happy", dur=0.2)
act(2.0, "wiz", "look", to=[0.15, -0.55], dur=0.25, blink=False)
for k, d in (("a", 0.0), ("b", 0.08)):
    act(1.55 + d, k, "look", to=[0, 0.55], dur=0.2, blink=False)
    act(1.7 + d, k, "arm", side=BAG_SIDE[k], pose=BAG_UP, dur=0.35, ease="settle")
# one sweet each: the bowl dips toward a bag, a sweet tips out and drops in
CANDY_T = {"a": 2.55, "b": 3.12}
act(2.25, "wiz", "arm", side="L", pose=BOWL_OUT, dur=0.3, ease="inOut")
for k, t in CANDY_T.items():
    prop(t - 0.15, "bowl", 0.18, ease="inOut", tilt=-28 if k == "a" else 28)
    prop(t + 0.12, "bowl", 0.18, ease="inOut", tilt=0)
    sfx(t, "crinkle", 0.3, dur=0.25)
act(2.85, "wiz", "look", to=[0.45, -0.55], dur=0.2, blink=False)
for k, t in CANDY_T.items():
    act(t + 0.4, k, "look", to=[0, -0.6], dur=0.15, blink=False)     # into the bag
    act(t + 0.45, k, "expr", expr="delighted", set={"eye": 1.1}, dur=0.15)
    act(t + 0.75, k, "look", to=[0, 0.55], dur=0.2, blink=False)
act(3.4, "wiz", "arm", side="L", pose=BOWL, dur=0.3)
act(3.45, "wiz", "move", to=WIZ_IN, dur=0.4, ease="inOut")
prop(3.65, "door", 0.4, ease="inOut", open=0)
sfx(4.05, "latch", 0.45)
for k in ("a", "b"):
    act(3.6, k, "arm", side=BAG_SIDE[k], pose=BAG_HOLD, dur=0.35)

# ---------------------------------------------------------------- 03 again (4.2-7.0)
act(4.25, "a", "move", to=A_KNOCK, dur=0.35, ease="inOut")
act(4.3, "b", "move", to=B_KNOCK, dur=0.35, ease="inOut")
act(4.45, "a", "arm", side=KNOCK_SIDE, pose=KNOCK_OUT, dur=0.2)
act(4.45, "a", "look", to=[0, 0.25], dur=0.15, blink=False)
for t in (4.7, 5.02):
    act(t, "a", "arm", side=KNOCK_SIDE, pose=KNOCK_IN, dur=0.1, ease="linear")
    act(t + 0.1, "a", "arm", side=KNOCK_SIDE, pose=KNOCK_OUT, dur=0.12, ease="out")
    sfx(t + 0.1, "knock", 0.6)
act(5.3, "a", "arm", side=KNOCK_SIDE, pose=REST, dur=0.25)
act(5.35, "a", "move", to=A_SERVE, dur=0.35, ease="inOut")
act(5.38, "b", "move", to=B_SERVE, dur=0.35, ease="inOut")
OPEN2 = 5.5
prop(OPEN2, "door", 0.35, ease="out", open=0.72)
sfx(OPEN2, "creak", 0.18, dur=0.3)
for k, d in (("a", 0.0), ("b", 0.06)):
    act(5.7 + d, k, "arm", side=BAG_SIDE[k], pose=BAG_UP, dur=0.3, ease="settle")
    act(5.7 + d, k, "expr", expr="kind", set={"eye": 1.25, "pupil": 1.45, "curve": 0.5}, dur=0.2)   # hopeful
    act(5.7 + d, k, "look", to=[0, 0.55], dur=0.2, blink=False)
say(5.75, "a", "Trick or treat!", tone="calm", caption=False)
say(5.79, "b", "Trick or treat!", tone="calm", caption=False)
cap(5.75, "Trick or treat!", 0.6)
# the Wizard recognises them
act(OPEN2 + 0.35, "wiz", "look", to=[0.25, -0.5], dur=0.2, blink=False)
act(6.1, "wiz", "expr", expr="stern", set={"curve": -0.1}, dur=0.2)
act(6.15, "wiz", "face", brow=-0.6, lid=0.42, dur=0.2)                  # brows down, heavy lids
act(6.32, "wiz", "blink")                                               # a tired blink
say(6.42, "wiz", "Again?", tone="calm", caption=False)
cap(6.42, "Again?", 0.56)
prop(6.75, "door", 0.18, ease="in", open=0)
sfx(6.93, "slam", 0.45)
sfx(6.97, "latch", 0.4)
for k in ("a", "b"):
    act(6.93, k, "squash", amount=0.12, dur=0.2)
    act(6.93, k, "expr", expr="sad", set={"eye": 1.15, "open": 0.2}, dur=0.08)

# ---------------------------------------------------------------- 04 the prank (7.0-9.0): an ellipsis, bags already down
P4 = S["prank"]
PC = P4 - 0.025                  # the cut-away moves finish a frame before the new shot shows
act(7.1, "wiz", "move", to=WIZ_BEHIND, dur=0.01)
for k, to, face in (("a", A_THROW, 180), ("b", B_THROW, 175)):
    act(PC, k, "move", to=to, dur=0.01)
    act(PC, k, "turn", to=face, dur=0.01)
    act(PC, k, "arm", side="L", pose=REST, dur=0.01)
    act(PC, k, "arm", side="R", pose=REST, dur=0.01)
    act(PC, k, "expr", expr="evil", dur=0.01)
act(PC, "a", "release", prop="bagA", to=[BAG_A_GROUND[0], 0, BAG_A_GROUND[1]], dur=0.01, ease="linear")
act(PC, "b", "release", prop="bagB", to=[BAG_B_GROUND[0], 0, BAG_B_GROUND[1]], dur=0.01, ease="linear")
prop(PC + 0.01, "bagA", 0.01, ease="linear", rot=10)
prop(PC + 0.01, "bagB", 0.01, ease="linear", rot=-14)
# the door has to be shut behind them from here, the Wizard and the Samurai wait inside
REACH = {"a": 7.25, "b": 7.38}
THROW = {"a": 8.0, "b": 8.14}
REL = {k: round(t + 0.16, 3) for k, t in THROW.items()}
for k, rid, bag in (("a", "rollA", BAG_A_GROUND), ("b", "rollB", BAG_B_GROUND)):
    r0 = REACH[k]
    prop(PC, rid, 0.01, ease="linear", x=bag[0], y=0.035, z=bag[1], scale=ROLL_S, rot=90)
    act(r0 - 0.1, k, "look", to=[0.3, -0.7], dur=0.15, blink=False)
    act(r0 - 0.05, k, "lean", to=14, dur=0.25)
    TH = THROW_SIDE[k]
    act(r0, k, "arm", side=TH, pose={"prop": rid, "grip": [0, 0.12, 0]}, dur=0.25, ease="inOut")
    act(r0 + 0.25, k, "grab", prop=rid, hand=TH, grip=[0, 0.12, 0], pose=None)
    act(r0 + 0.3, k, "lean", to=0, dur=0.25)
    act(r0 + 0.3, k, "arm", side=TH, pose=THROW_BACK, dur=0.3, ease="inOut")
    act(r0 + 0.35, k, "look", to=[0, 0.45], dur=0.2, blink=False)
    t = THROW[k]
    act(t, k, "arm", side=TH, pose=THROW_UP, dur=0.22, ease="in")
    act(t, k, "lean", to=-7, dur=0.2)
    act(t + 0.5, k, "lean", to=0, dur=0.3)
    sfx(REL[k], "whoosh", 0.25, dur=0.3)
say(7.6, "a", "hehe", tone="calm", caption=False)
cap(7.6, "hehe", 0.5)
# behind the shut door: the Samurai takes the doorway (the door is opened for him behind the cut)
act(8.9, "sam", "move", to=SAM_DOOR, dur=0.02)
act(8.9, "sam", "tilt", to=SAM_LOW_T, dur=0.02)
prop(S["samurai"] - 0.02, "door", 0.02, ease="linear", open=1)

# ---------------------------------------------------------------- 05 the Samurai (9.0-10.2): one weighted step
P5 = S["samurai"]
act(P5, "sam", "show")
for k in ("a", "b"):
    act(P5, k, "still", dur=S["realize"] - P5 - 0.2, idle=0.0, fade=0.2)    # the slow motion holds them
    act(P5, k, "arm", side=THROW_SIDE[k], pose=THROW_UP, dur=0.01)
act(P5 + 0.25, "sam", "move", to=SAM_OUT, dur=0.6, ease="inOut", steps=1.0)
sfx(P5 + 0.82, "step", 0.6)
act(P5 + 0.82, "sam", "squash", amount=0.05, dur=0.25)
act(P5, "sam", "still", dur=0.2, idle=0.05)
sfx(P5, "sting", 0.35)

# ---------------------------------------------------------------- 06 eyes (10.2-11.2)
P6 = S["eyes"]
act(P6 - 0.6, "sam", "arm", side="R", pose=GUARD, dur=0.4, ease="inOut")      # the blade comes up off camera
act(P6 - 0.6, "sam", "tilt", to=GUARD_T, dur=0.4)
act(P6, "sam", "still", dur=2.9, idle=0.04)
act(P6, "sam", "look", to=[0, 0], dur=0.05, blink=False)
act(P6 + 0.35, "sam", "look", to=[0.15, 0.4], dur=0.25, blink=False)    # one deliberate move: up to the rolls
act(P6 + 0.35, "sam", "face", lid=0.38, brow=-0.5, dur=0.3)

# ---------------------------------------------------------------- 07 along the blade (11.2-13.0)
GLINT = 12.80
at(GLINT, fx="glint", who="sam", dur=0.5, size=0.09)
sfx(GLINT, "ting", 0.45)

# ---------------------------------------------------------------- 08 first cut (13.0-14.4)
CUT1_AT, CUT1_D = 13.42, 0.18
act(13.1, "sam", "face", lid=0.3, brow=-0.6, dur=0.15)
act(CUT1_AT, "sam", "arm", side="R", pose=ACROSS, dur=CUT1_D, ease="linear")
act(CUT1_AT, "sam", "tilt", to=ACROSS_T, dur=CUT1_D, ease="linear")
act(CUT1_AT, "sam", "lean", to=-8, dur=CUT1_D)
sfx(CUT1_AT, "whoosh", 0.45, dur=0.2)
U1 = 0.4                                    # where in the stroke the blade meets the roll
T_CUT1 = round(CUT1_AT + CUT1_D * U1, 3)
sfx(T_CUT1, "papercut", 0.55)

# ---------------------------------------------------------------- 09 second cut, macro (14.4-16.0)
CUT2_AT, CUT2_D = 14.4, 1.4                 # authored slow: the macro is in slow motion
# in three legs, slowest through the roll so the blade never crosses the close-up in a frame or two
LEGS2 = [(0.0, 0.36, 14.4, 0.3), (0.36, 0.44, 14.7, 0.8), (0.44, 1.0, 15.5, 0.3)]


def lerp_pose(a, b, k):
    return [round(a[j] + (b[j] - a[j]) * k, 4) for j in range(len(a))]


for k0, k1, t, d in LEGS2:
    act(t, "sam", "arm", side="R", pose={"o": lerp_pose(ACROSS["o"], RISE["o"], k1)}, dur=d, ease="linear")
    act(t, "sam", "tilt", to=lerp_pose(ACROSS_T, RISE_T, k1), dur=d, ease="linear")
act(CUT2_AT, "sam", "lean", to=4, dur=CUT2_D)
T_CUT2 = round(14.7 + 0.8 * (0.4 - 0.36) / 0.08, 3)       # 0.4 of the stroke, inside the slow leg
U2 = 0.4
sfx(T_CUT2 - 0.1, "whoosh", 0.3, dur=0.35)
sfx(T_CUT2, "papercut", 0.6)

# ---------------------------------------------------------------- 10 follow-through (16.0-17.6)
P10 = S["follow"]
act(P10 - 0.05, "sam", "arm", side="R", pose=FINISH, dur=0.22, ease="out")
act(P10 - 0.05, "sam", "tilt", to=FINISH_T, dur=0.22, ease="out")
act(P10 - 0.05, "sam", "lean", to=6, dur=0.22)
act(P10 + 0.3, "sam", "lean", to=0, dur=0.6)
act(P10 + 0.2, "sam", "face", lid=0.5, brow=-0.3, dur=0.4)
act(P10 + 0.2, "sam", "look", to=[0, -0.1], dur=0.3, blink=False)

# ---------------------------------------------------------------- 11 realization (17.6-18.8)
P11 = S["realize"]
act(P11 - 0.02, "a", "move", to=[0.24, 1.36], dur=0.01)
act(P11 - 0.02, "b", "move", to=[-0.24, 1.70], dur=0.01)
for k, d in (("a", 0.0), ("b", 0.08)):
    act(P11 + d, k, "look", to=[0.1, -0.35], dur=0.25, blink=False)        # the halves on the ground
    act(P11 + d, k, "arm", side=THROW_SIDE[k], pose=REST, dur=0.4)
act(P11 + 0.55, "a", "look", to=[0.6, 0.0], dur=0.15, blink=False)         # at each other
act(P11 + 0.58, "b", "look", to=[-0.6, 0.0], dur=0.15, blink=False)
for k, d in (("a", 0.0), ("b", 0.08)):
    act(P11 + d, k, "expr", expr="kind", set={"curve": 0.1}, dur=0.15)      # the grin is gone: watching
act(P11 + 0.72, "a", "expr", expr="sad", set={"eye": 1.25, "open": 0.5, "pupil": 0.6}, dur=0.08)
act(P11 + 0.75, "b", "expr", expr="shocked", set={"open": 0.5}, dur=0.08)
for k, d in (("a", 0.0), ("b", 0.03)):
    act(P11 + 0.72 + d, k, "squash", amount=-0.06, dur=0.2)
sfx(P11 + 0.72, "gasp", 0.5)

# ---------------------------------------------------------------- 12 run (18.8-22.0)
P12 = S["run"]
for k, d, to, steps in (("a", 0.0, A_FLEE, 5.0), ("b", 0.18, B_FLEE, 6.5)):
    act(P12 + d, k, "turn", to=0, dur=0.15)
    act(P12 + d, k, "expr", expr="shocked", set={"open": 0.9, "curve": -0.6, "eye": 1.3}, dur=0.08)
    act(P12 + 0.05 + d, k, "move", to=to, dur=1.6, ease="in", steps=steps)
    act(P12 + 0.05 + d, k, "arm", side="R", pose={"o": [0.22, 0.5, 0.1]}, dur=0.2)
    act(P12 + 0.05 + d, k, "arm", side="L", pose={"o": [0.22, 0.5, 0.1]}, dur=0.2)
for t in (P12 + 0.25, P12 + 0.5, P12 + 0.75, P12 + 1.0):
    sfx(t, "step", 0.18)
act(P11 - 0.3, "sam", "arm", side="R", pose=SAM_LOW, dur=0.5, ease="inOut")
act(P11 - 0.3, "sam", "tilt", to=SAM_LOW_T, dur=0.5)
act(P12 + 1.2, "sam", "blink")
act(P12 + 1.4, "wiz", "move", to=[0.04, -1.25], dur=0.6, ease="inOut")    # the Wizard comes to the doorway behind him
act(P12 + 1.9, "wiz", "look", to=[-0.3, -0.3], dur=0.25, blink=False)
act(P12 + 2.0, "wiz", "expr", expr="happy", dur=0.3)
act(P12 + 1.8, "sam", "look", to=[0.4, -0.5], dur=0.3, blink=False)        # down at the bag they left behind

# ---------------------------------------------------------------- props placed from the layout
def frame_of(t):
    if not lay:
        return None
    fr = lay.get("aims", []) + lay["samples"]
    return min(fr, key=lambda f: abs(f["t"] - t))


def actor(f, who):
    return next((a for a in f["actors"] if a["id"] == who), None)


def prop_at(f, pid):
    return next((p for p in f["props"] if p["id"] == pid), None)


G = -9.8


def ballistic(p0, p1, T, g=G):
    return [(p1[0] - p0[0]) / T, (p1[1] - p0[1] - 0.5 * g * T * T) / T, (p1[2] - p0[2]) / T]


def sub(a, b):
    return [a[i] - b[i] for i in range(3)]


def norm(v):
    n = math.sqrt(sum(x * x for x in v)) or 1
    return [x / n for x in v]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


# the sweets: from the bowl's lip into each bag
f0 = frame_of(0.1)
if f0:
    for k, cid in (("a", "candyA"), ("b", "candyB")):
        t = CANDY_T[k]
        fb = frame_of(t)
        bw = prop_at(fb, "bowl")["at"]
        bag = prop_at(frame_of(t + 0.35), "bagA" if k == "a" else "bagB")["at"]
        side = -1 if k == "a" else 1
        prop(t - 0.03, cid, 0.01, ease="linear", x=round(bw[0] + 0.05 * (1 if k == "b" else -1), 4), y=round(bw[1] + 0.09, 4), z=round(bw[2] + 0.04, 4), scale=1)
        prop(t, cid, 0.35, ease="linear", arc=0.06, x=bag[0], y=round(bag[1] + 0.12, 4), z=bag[2])
        prop(t + 0.35, cid, 0.06, ease="in", y=round(bag[1] + 0.05, 4), scale=0)
        at(t + 0.36, fx="glint", pos=[bag[0], bag[1] + 0.16, bag[2]], dur=0.35, size=0.05)

# the rolls' clock: real time for the throw, nearly frozen from 9 s, slow for the cuts, real time for the landing
WARP = [(8.65, 0.35), (9.0, 0.04), (13.0, 0.12), (S["follow"], 1.0)]


def clock(t):
    c, prev, rate = 0.0, 0.0, 1.0
    for t1, r1 in WARP:
        if t <= t1:
            return c + (t - prev) * rate
        c += (t1 - prev) * rate
        prev, rate = t1, r1
    return c + (t - prev) * rate


SPLIT_AT = {}
TRACK = {}
CAMS = {}
if lay:
    for k, rid, tc, cut_at, cut_d, u_in in (("a", "rollA", T_CUT1, CUT1_AT, CUT1_D, U1), ("b", "rollB", T_CUT2, CUT2_AT, CUT2_D, U2)):
        fs, fp, fn = frame_of(tc), frame_of(tc - 1 / FPS), frame_of(tc + 1 / FPS)
        s, sp, sn = actor(fs, "sam"), actor(fp, "sam"), actor(fn, "sam")
        if not (s and s.get("prop")):
            continue
        a, b = s["prop"]["a"], s["prop"]["b"]
        u = 0.88 if k == "a" else 0.84               # roll A near the tip, roll B mid-blade: they never share a spot
        c = [a[j] + (b[j] - a[j]) * u for j in range(3)]
        cp = [sp["prop"]["a"][j] + (sp["prop"]["b"][j] - sp["prop"]["a"][j]) * u for j in range(3)]
        cn = [sn["prop"]["a"][j] + (sn["prop"]["b"][j] - sn["prop"]["a"][j]) * u for j in range(3)]
        vel = sub(cn, cp)
        blade = norm(sub(b, a))
        n = norm(cross(blade, vel))                        # the swing plane's normal: the roll's axis, so the cut parts it
        rot = math.degrees(math.atan2(-n[2], n[0]))
        tilt = -math.degrees(math.asin(max(-1, min(1, n[1]))))
        R = 0.062 * ROLL_S
        t0 = REL[k]
        hand = actor(frame_of(t0), k)["hands"][THROW_SIDE[k]]
        p0 = [hand[0], hand[1] - 0.12 * ROLL_S + 0.01, hand[2]]
        cc = [c[0], c[1] - R, c[2]]                        # the roll's bottom so its middle sits on the blade
        T = clock(tc) - clock(t0)
        v = ballistic(p0, cc, T)
        act(t0, k, "release", prop=rid, to=[round(p0[0] + v[0] / FPS, 4), round(p0[1] + v[1] / FPS + 0.5 * G / FPS / FPS, 4), round(p0[2] + v[2] / FPS, 4)], dur=round(1 / FPS, 4), ease="linear")
        t = t0 + 1 / FPS
        last = None
        tsplit = tc
        # the flight, frame by frame on the rolls' clock; it turns to its cutting angle on the way (no spin: the sheet
        # stays readable), and after the cut the halves drift apart on the same clock
        while t < S["follow"] + 0.0001:
            tn = t + 1 / FPS
            tau = clock(min(tn, tc)) - clock(t0) + (0.25 * (clock(tn) - clock(tc)) if tn > tc else 0)
            p = [p0[j] + v[j] * tau + (0.5 * G * tau * tau if j == 1 else 0) for j in range(3)]
            w = min(1, tau / max(0.01, T))
            st = {"x": round(p[0], 4), "y": round(p[1], 4), "z": round(p[2], 4), "rot": round(rot, 2), "tilt": round(tilt * w, 2), "sway": round(clock(tn), 4)}
            prop(t, rid, round(1 / FPS, 4), ease="linear", **st)
            last = p
            TRACK.setdefault(k, []).append((round(tn, 4), [p[0], p[1] + R, p[2]]))   # the roll's middle
            t = round(t + 1 / FPS, 4)
        SPLIT_AT[k] = (c, n, blade, norm(vel))
        print(k, "contact", [round(x, 3) for x in c], "axis", [round(x, 2) for x in n], "blade", [round(x, 2) for x in blade], "vel", [round(x, 2) for x in norm(vel)])
        prop(tc, rid, 0.5 if k == "a" else 1.0, ease="out" if k == "a" else "inOut", split=1)
        prop(tc, rid, 1.2 if k == "a" else 1.0, ease="out" if k == "a" else "inOut", apart=2.2)
        # real time again: the halves drop onto the landing
        p = last
        fall = max(0.25, math.sqrt(max(0.01, 2 * p[1] / 9.8)))
        prop(S["follow"] + 0.04, rid, fall, ease="in", y=0.004, tilt=0)
        prop(S["follow"] + 0.04 + fall, rid, 0.12, ease="settle", squash=0.0)
        sfx(S["follow"] + 0.04 + fall, "land", 0.25)

    # the close cameras, from the Samurai's head and blade
    fb = frame_of(S["blade"] + 0.2)
    sb_ = actor(fb, "sam")
    if sb_ and sb_.get("prop"):
        CAMS["blade"] = (sb_["prop"]["a"], sb_["prop"]["b"])

# ---------------------------------------------------------------- cameras
shots = [
    {"at": S["knock"], "pos": [1.35, 0.50, 0.40], "look": [0.0, 0.38, -0.55], "fov": 50},
    {"at": S["sweets"], "pos": [0.05, 1.05, 3.10], "look": [-0.02, 0.70, -0.70], "fov": 36,
     "to": {"pos": [0.05, 1.0, 2.80]}, "dur": 3.0, "ease": "inOut"},
    {"at": S["again"], "pos": [0.05, 1.05, 3.10], "look": [-0.02, 0.70, -0.70], "fov": 36,
     "to": {"pos": [0.03, 0.98, 2.55]}, "dur": 2.8, "ease": "inOut"},
    {"at": S["prank"], "pos": [1.40, 0.48, 0.40], "look": [0.05, 0.36, 1.50], "fov": 46},
    {"at": S["samurai"], "pos": [0.0, 0.22, 1.75], "look": [-0.18, 0.82, -0.55], "fov": 52},
]
EYE = [SAM_OUT[0] - 0.06, 0.6, SAM_OUT[1] + 0.3]   # his face, roughly (the layout has no head point)
shots.append({"at": S["eyes"], "pos": [EYE[0] - 0.04, EYE[1] + 0.03, EYE[2] + 1.85], "look": EYE, "fov": 40})
if "blade" in CAMS:
    a, b = CAMS["blade"]
    off = [-0.62, 0.1, -0.44]            # outside his sword arm, a little behind: past the tip are the rolls in the sky
    hilt = [round(a[j] + (b[j] - a[j]) * 0.12, 3) for j in range(3)]
    tip = [round(a[j] + (b[j] - a[j]) * 0.97, 3) for j in range(3)]
    shots.append({"at": S["blade"], "pos": [round(hilt[j] + off[j], 3) for j in range(3)], "look": hilt, "fov": 36,
                  "to": {"pos": [round(tip[j] + off[j], 3) for j in range(3)], "look": tip}, "dur": GLINT - S["blade"] - 0.05, "ease": "inOut"})
else:
    shots.append({"at": S["blade"], "pos": [0.10, 0.60, 0.20], "look": [0.0, 0.60, -0.25], "fov": 30})
shots.append({"at": S["cut1"], "pos": [-1.5, 1.05, 1.9], "look": [-0.05, 0.8, 0.3], "fov": 40})
if "b" in SPLIT_AT:
    c, n, bl, vv = SPLIT_AT["b"]
    # from his left side, square to the roll's axis: the halves part across the frame, the blade crosses it diagonally
    o = [1.0, 0.15, 0.35]
    d = sum(o[j] * n[j] for j in range(3))
    o = norm([o[j] - d * n[j] for j in range(3)])
    o = norm([0.82 * o[j] - 0.5 * n[j] for j in range(3)])   # (on the side away from his face)   # a little toward the axis: the cut face and its layers show
    # the camera rides with the roll (it keeps drifting in the slow motion), so it stays centred and only the blade moves
    at_ = lambda tt: min(TRACK["b"], key=lambda q: abs(q[0] - tt))[1]
    # in short legs (one `to` each, joined end to start, so no cut shows): the roll slows down through the shot
    legs = 8
    for i in range(legs):
        ta = S["cut2"] + (S["follow"] - S["cut2"]) * i / legs
        tb = S["cut2"] + (S["follow"] - S["cut2"]) * (i + 1) / legs
        c0, c1 = at_(ta), at_(min(tb, S["follow"] - 0.034))
        shots.append({"at": round(ta, 3), "pos": [round(c0[j] + 0.42 * o[j], 3) for j in range(3)], "look": [round(v, 3) for v in c0], "fov": 24,
                      "to": {"pos": [round(c1[j] + 0.42 * o[j], 3) for j in range(3)], "look": [round(v, 3) for v in c1]}, "dur": round(tb - ta, 3), "ease": "linear", "cont": True})
else:
    shots.append({"at": S["cut2"], "pos": [0.3, 0.8, 0.8], "look": [0.2, 0.75, 0.2], "fov": 30})
shots += [
    {"at": S["follow"], "pos": [-1.75, 1.05, 3.05], "look": [0.0, 0.55, -0.30], "fov": 40},
    {"at": S["realize"], "pos": [0.36, 0.42, 0.30], "look": [-0.10, 0.30, 1.55], "fov": 50},
    {"at": S["run"], "pos": [0.55, 0.35, 3.90], "look": [0.05, 0.55, -0.40], "fov": 40},
]

# ---------------------------------------------------------------- beats (for the reviews and contact sheets)
BEATS = [("knock", S["knock"], "hook"), ("sweets", S["sweets"], None), ("again?", S["again"], None),
         ("the prank", S["prank"], "escalation"), ("the Samurai", S["samurai"], None), ("eyes", S["eyes"], None),
         ("along the blade", S["blade"], None), ("first cut", S["cut1"], None), ("second cut (macro)", S["cut2"], None),
         ("follow-through", S["follow"], None), ("realization", S["realize"], None), ("run", S["run"], None)]
items.sort(key=lambda x: x[0])
beats = []
for i, (name, start, kind) in enumerate(BEATS):
    end = BEATS[i + 1][1] if i + 1 < len(BEATS) else END
    mine = [dict(it, at=round(t - start, 3)) for t, it in items if (t >= start - 1e-6) and (i + 1 == len(BEATS) or t < BEATS[i + 1][1] - 1e-6)]
    b = {"name": name, "at": round(start, 3), "len": round(end - start, 3), "do": mine}
    if kind == "escalation":
        b["kind"] = kind
    beats.append(b)
pre = [dict(it, at=t) for t, it in items if t < 0]
AIM = sorted(set([0.1, S["eyes"] + 0.3, S["blade"] + 0.2] + [CANDY_T[k] + d for k in CANDY_T for d in (0, 0.35)] + list(REL.values())
                 + [round(T_CUT1 + d / FPS, 4) for d in (-1, 0, 1)] + [round(T_CUT2 + d / FPS, 4) for d in (-1, 0, 1)]))
sb = {
    "id": ID,
    "title": "Trick or treat: Samurai versus toilet paper",
    "format": "knock -> sweets -> knock again, 'Again?' -> toilet-roll prank -> the Samurai steps out -> eyes -> along the blade -> cut, macro cut -> follow-through -> realization -> they run",
    "idea": "Jonny, 25 Oct 2026 (production brief + concept boards)",
    "fps": FPS,
    "duration": END,
    "look": "anime-pro",
    "profile": "short",
    "cover": round(T_CUT1 + 0.12, 2),
    "creative": {"length": [12, 24], "loop": False},
    "set": {"type": "cottage", "seed": 3},
    "music": {"style": "sneaky", "parts": [{"at": 0, "part": "main"}, {"at": S["realize"], "part": "stop"}]},
    "cast": cast,
    "props": props,
    "shots": shots,
    "beats": beats,
    "aimAt": AIM,
    "notes": "Generated by storyboards/halloween/make-trick-or-treat-v2.py. The minis are extras (characters/halloween), the steel katana is for this clip only.",
}
(here / f"{ID}.json").write_text(json.dumps(sb, indent=1) + "\n")
print(f"wrote storyboards/halloween/{ID}.json  ({END:.2f} s, layout {'used' if lay else 'not found: run --layout and run me again'})")
