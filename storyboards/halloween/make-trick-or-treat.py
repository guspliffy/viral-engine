# Trick or treat (Jonny's idea, 25 Oct 2026): three mini trick-or-treaters knock, the Reaper answers and gives them
# exactly one sweet, they knock again for more and he slams the door, they throw toilet rolls at the house, the door
# bursts open on the Samurai: slow motion, a push in on his face, down to the hilt and up the blade to a glint, three
# slashes through the hanging rolls, a beat, the click of the blade going down, and every roll falls in two. The kids
# run, and the witch tiptoes back to knock again (the loop).
#
# One continuous camera (sb.camera keys: pushes, tilts and a rise along the blade, no cuts). Slow motion is in the
# rolls' flight: their clock runs at SLOW of real time from the burst until the click.
#
# Run: python3 storyboards/halloween/make-trick-or-treat.py   -> storyboards/halloween/trick-or-treat.json
# The throws and the slashes are aimed from the last layout (out/trick-or-treat.layout.json: hands and blade line per
# frame), so after changing poses run --layout, then this script again, then --layout once more to check.
import json, math, pathlib

here = pathlib.Path(__file__).parent
root = here.parent.parent
LAYOUT = root / "out" / "trick-or-treat-anime-pro.layout.json"
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


# ---------------------------------------------------------------- places (set-porch.js PORCH)
DOOR_X, DOOR_W, WALL_Z = -0.38, 1.15, -0.72
HINGE = [DOOR_X - DOOR_W / 2, 0, -0.76]
INSIDE = [-0.30, -1.62]          # where the Reaper (and later the Samurai) stands behind the door
STEP = [-0.30, -1.12]            # one step forward once the door is open
KNOCK_AT = [0.32, -0.48]         # the witch, side-on to the door
W0, P0, G0 = [0.38, -0.12], [0.60, 0.52], [0.92, -0.14]          # the kids on the porch
W1, P1, G1 = [0.64, 0.30], [0.86, 0.96], [1.20, -0.26]           # backed off to throw
SAM_OUT = [-0.52, -0.36]         # the Samurai's spot on the porch for the slashes

# poses (character space: o = [out, up, forward]; the kids are cast at scale 0.5)
SCYTHE = {"o": [0.26, 0.36, 0.22]}
BOWL = {"o": [-0.22, 0.14, 0.50]}
BOWL_OFFER = {"o": [-0.12, 0.20, 0.62]}
BUCKET = {"o": [0.18, 0.28, 0.05]}
BUCKET_OUT = {"o": [0.16, 0.48, 0.5]}
KNOCK_IN = {"world": [0.09, 0.40, -0.69]}
KNOCK_OUT = {"world": [0.10, 0.40, -0.635]}
THROW_BACK = {"o": [0.16, 0.26, -0.10]}
THROW_UP = {"o": [0.04, 0.80, 0.34]}
GUARD = {"o": [-0.12, 0.45, 0.34]}
WIND = GUARD                              # blade upright in front of him, as he came out
ACROSS = {"o": [-0.35, 0.30, 0.42]}      # blade across to his left
HIGH = GUARD                              # the second cut rises back to upright (every stroke stays clear of the open door)
LOW = {"o": [-0.20, 0.25, 0.40]}         # blade down to his left
SAM_REST = {"o": [0.24, 0.36, 0.08]}   # the reference staff hold: fist out from the side, blade up

KIDS = {"witch": "kids/witch", "pumpkin": "kids/pumpkin", "ghost": "kids/ghost"}
BUCKETS = {"witch": ("b_witch", "pumpkin"), "pumpkin": ("b_pumpkin", "cauldron"), "ghost": ("b_ghost", "ghost")}
ROLLS = {"witch": "r_witch", "pumpkin": "r_pumpkin", "ghost": "r_ghost"}

cast = [
    {"id": "reaper", "character": "potatobrawl/reaper", "at": INSIDE[:], "face": "camera", "expr": "deadpan",
     "arms": {"R": SCYTHE, "L": BOWL}, "grip": {"L": "cup"}},
    {"id": "sam", "character": "potatobrawl/samurai", "at": INSIDE[:], "face": "camera", "expr": "focused", "arms": {"R": GUARD}},
    {"id": "witch", "character": KIDS["witch"], "at": KNOCK_AT[:], "face": -72, "scale": 0.5, "expr": "eager",
     "arms": {"L": BUCKET, "R": KNOCK_OUT}},
    {"id": "pumpkin", "character": KIDS["pumpkin"], "at": P0[:], "face": -35, "scale": 0.5, "expr": "eager", "arms": {"L": BUCKET}},
    {"id": "ghost", "character": KIDS["ghost"], "at": G0[:], "face": -48, "scale": 0.5, "expr": "eager", "arms": {"L": BUCKET}},
]
props = [
    {"id": "door", "kind": "door", "x": HINGE[0], "y": 0, "z": HINGE[2], "w": DOOR_W, "h": 1.8, "open": 0},
    {"id": "bowl", "kind": "bowl", "x": 0, "y": 0, "z": -1.0},
    {"id": "candy", "kind": "candy", "x": 0, "y": 0, "z": -1.0, "color": "#e8b53a"},
]
for k, (bid, style) in BUCKETS.items():
    props.append({"id": bid, "kind": "bucket", "style": style, "scale": 0.65, "x": 0, "y": 0, "z": 0})
for i, (k, rid) in enumerate(ROLLS.items()):
    props.append({"id": rid, "kind": "tproll", "scale": 0.85, "x": 0, "y": 0, "z": 0, "phase": i * 2.1, "tail": 0.3})

# ---------------------------------------------------------------- setup (time 0)
for who in ("reaper", "sam", "witch", "pumpkin", "ghost"):
    act(0, who, "noblink")
act(0, "sam", "hide")
act(0, "reaper", "tilt", to=[0, -12], dur=0.01)
act(0, "reaper", "grab", prop="bowl", hand="L", grip="base", off=[0, 0.035, 0], pose=None)
for k, (bid, _) in BUCKETS.items():
    act(0, k, "grab", prop=bid, hand="L", grip="bail", pose=None)
# each kid's roll rides in its bucket (held with the bucket's hand), the sweet sits on the bowl
for k, rid in ROLLS.items():
    pass   # placed below, once the bucket positions are known from the layout

# ---------------------------------------------------------------- 0.0  knock knock
for i, t in enumerate([0.02, 0.24, 0.46]):
    act(t, "witch", "arm", side="R", pose=KNOCK_IN, dur=0.1, ease="linear")
    act(t + 0.1, "witch", "arm", side="R", pose=KNOCK_OUT, dur=0.12, ease="out")
    sfx(t + 0.1, "knock", 0.55)
act(0, "witch", "look", to=[-0.4, 0.1], dur=0.1, blink=False)
act(0.62, "witch", "arm", side="R", pose="rest", dur=0.3)
act(0.66, "witch", "move", to=W0, dur=0.4, ease="inOut")
act(0.66, "witch", "turn", to=-50, dur=0.35)
for k in ("pumpkin", "ghost"):
    act(0.3, k, "look", to=[-0.5, 0.15], dur=0.25, blink=False)
act(0.7, "witch", "blink")

# ---------------------------------------------------------------- 0.95  the door opens: the Reaper
prop(0.95, "door", 0.6, ease="out", open=1)
sfx(0.95, "creak", 0.25, dur=0.55)
act(1.25, "reaper", "move", to=STEP, dur=0.4, ease="inOut")
act(1.3, "reaper", "look", to=[0.45, -0.25], dur=0.25, blink=False)
act(1.3, "reaper", "turn", to=18, dur=0.4)
for k, d in (("witch", 0.0), ("pumpkin", 0.05), ("ghost", 0.1)):
    act(1.55 + d, k, "look", to=[-0.45, 0.35], dur=0.2, blink=False)
    act(1.62 + d, k, "hop", height=0.05, dur=0.28)
    act(1.62 + d, k, "expr", expr="delighted", dur=0.12)
say(1.62, "witch", "trick or treat!", tone="excited")
# "nice costume!": they think Death is a costume
say(2.75, "ghost", "nice costume!", tone="excited")
act(2.78, "ghost", "hop", height=0.06, dur=0.3)
act(3.25, "reaper", "look", to=[0.0, -0.75], dur=0.3, blink=False)       # looks down at his robe
act(3.25, "reaper", "still", dur=0.7, idle=0.15)
act(3.75, "reaper", "look", to=[0.45, -0.25], dur=0.25, blink=False)
say(3.85, "reaper", "thanks.", tone="calm")
act(4.25, "reaper", "blink")

# ---------------------------------------------------------------- 4.6  exactly one sweet
act(4.45, "witch", "arm", side="L", pose=BUCKET_OUT, dur=0.35, ease="settle")
act(4.55, "reaper", "arm", side="L", pose=BOWL_OFFER, dur=0.35, ease="inOut")
prop(4.95, "bowl", 0.25, ease="inOut", tilt=-24)
CANDY_T = 5.08
prop(5.35, "bowl", 0.3, ease="inOut", tilt=0)
act(5.5, "reaper", "arm", side="L", pose=BOWL, dur=0.4)
sfx(CANDY_T + 0.42, "tink", 0.35)
for k, d in (("witch", 0.0), ("pumpkin", 0.07), ("ghost", 0.12)):
    act(5.55 + d, k, "look", to=[-0.1, -0.7], dur=0.18, blink=False)          # into the bucket
    act(5.55 + d, k, "expr", expr="kind", dur=0.2)
    act(6.0 + d, k, "look", to=[0.4 if k == "witch" else -0.4, 0.1], dur=0.18, blink=False)   # at each other
act(5.95, "witch", "arm", side="L", pose=BUCKET, dur=0.35)
act(6.2, "witch", "expr", expr="sad", dur=0.2)
act(6.25, "witch", "look", to=[-0.45, 0.35], dur=0.2, blink=False)
say(6.3, "witch", "...one?", tone="calm")
act(6.65, "reaper", "squash", amount=0.06, dur=0.25)
act(6.95, "reaper", "move", to=INSIDE, dur=0.35, ease="inOut")
prop(7.0, "door", 0.42, ease="inOut", open=0)
sfx(7.42, "land", 0.35)
act(7.1, "reaper", "turn", to=0, dur=0.3)

# ---------------------------------------------------------------- 7.6  knock again (more!)
act(7.55, "witch", "move", to=KNOCK_AT, dur=0.35, ease="inOut")
act(7.55, "witch", "turn", to=-72, dur=0.3)
act(7.75, "witch", "arm", side="R", pose=KNOCK_OUT, dur=0.15)
for t in (7.92, 8.08, 8.24):
    act(t, "witch", "arm", side="R", pose=KNOCK_IN, dur=0.06, ease="in")
    act(t + 0.07, "witch", "arm", side="R", pose=KNOCK_OUT, dur=0.08, ease="out")
    sfx(t + 0.06, "knock", 0.6)
act(8.42, "witch", "arm", side="R", pose="rest", dur=0.25)
act(8.42, "witch", "move", to=W0, dur=0.3, ease="out")
act(8.42, "witch", "turn", to=-50, dur=0.3)
act(8.2, "reaper", "expr", expr="stern", dur=0.2)
prop(8.6, "door", 0.32, ease="out", open=1)
sfx(8.6, "creak", 0.2, dur=0.3)
act(8.8, "reaper", "move", to=STEP, dur=0.3)
act(8.8, "reaper", "look", to=[0.45, -0.25], dur=0.2, blink=False)
act(8.8, "reaper", "turn", to=18, dur=0.3)
for k, d in (("witch", 0.0), ("pumpkin", 0.04), ("ghost", 0.08)):
    act(8.95 + d, k, "arm", side="L", pose=BUCKET_OUT, dur=0.3, ease="settle")
    act(8.95 + d, k, "expr", expr="kind", set={"eye": 1.25, "pupil": 1.45, "curve": 0.3}, dur=0.2)   # puppy eyes
    act(8.95 + d, k, "look", to=[-0.45, 0.35], dur=0.2, blink=False)
say(9.1, "witch", "more?", tone="calm")
# the slam
act(9.75, "reaper", "expr", expr="stern", set={"browY": -0.025, "eye": 0.7}, dur=0.1)
act(9.8, "reaper", "squash", amount=0.1, dur=0.2)
act(9.85, "reaper", "move", to=INSIDE, dur=0.2, ease="in")
prop(9.9, "door", 0.13, ease="in", open=0)
SLAM = 10.03
sfx(SLAM, "slam", 0.7)
at(SLAM, fx="shake", dur=0.25, amp=0.025)
for k in ("witch", "pumpkin", "ghost"):
    act(SLAM, k, "squash", amount=0.16, dur=0.22)
    act(SLAM, k, "expr", expr="shocked", set={"open": 0.2}, dur=0.06) if k == "witch" else act(SLAM, k, "expr", expr="sad", set={"eye": 1.2, "open": 0.3}, dur=0.06)
    act(SLAM + 0.3, k, "arm", side="L", pose=BUCKET, dur=0.3)
act(SLAM, "witch", "hatwobble", amount=10, freq=3, dur=0.8)
# behind the closed door: the Reaper goes, the Samurai comes
act(SLAM + 0.1, "reaper", "hide")
act(SLAM + 0.15, "sam", "arm", side="L", pose={"o": [0.06, 0.08, -0.32]}, dur=0.01)   # free hand back before the burst, clear of the flying rolls
act(SLAM + 0.15, "reaper", "move", to=[0.55, -1.7], dur=0.02)
act(SLAM + 0.15, "sam", "show")

# ---------------------------------------------------------------- 10.2  the kids' revenge
for k, d in (("witch", 0.0), ("pumpkin", 0.06), ("ghost", 0.12)):
    act(10.45 + d, k, "look", to=[0.5 if k == "witch" else -0.5, 0.0], dur=0.15, blink=False)
    act(10.85 + d, k, "expr", expr="evil", dur=0.2)
say(10.95, "witch", "trick it is.", tone="calm")
# back off, take a roll out of the bucket, wind up
for k, (to, d) in (("witch", (W1, 0.12)), ("pumpkin", (P1, 0.0)), ("ghost", (G1, 0.05))):
    act(11.55 + d, k, "move", to=to, dur=0.4, ease="inOut")
    act(11.55 + d, k, "turn", to={"witch": -55, "pumpkin": -40, "ghost": -70}[k], dur=0.4)
REACH = 11.75
for k, d in (("witch", 0.0), ("pumpkin", 0.05), ("ghost", 0.1)):
    rid = ROLLS[k]
    act(REACH - 0.2 + d, k, "arm", side="L", pose={"o": [0.0, 0.3, 0.38]}, dur=0.3, ease="inOut")    # the bucket comes round to the front
    act(REACH - 0.1 + d, k, "arm", side="R", pose={"o": [0.0, 0.42, 0.42]}, dur=0.2, ease="inOut")   # the hand goes forward first, clear of the body
    act(REACH + 0.1 + d, k, "arm", side="R", pose={"prop": rid, "grip": [0, 0.12, 0]}, dur=0.2, ease="inOut")
    act(REACH + 0.3 + d, k, "grab", prop=rid, hand="R", grip=[0, 0.12, 0], pose=None)
    act(REACH + 0.32 + d, k, "arm", side="R", pose=THROW_BACK, dur=0.3, ease="inOut")
    act(REACH + 0.4 + d, k, "arm", side="L", pose=BUCKET, dur=0.3, ease="inOut")
THROW = 12.55
REL = {}
for k, d in (("witch", 0.0), ("pumpkin", 0.06), ("ghost", 0.12)):
    act(THROW + d, k, "arm", side="R", pose=THROW_UP, dur=0.22, ease="in")
    act(THROW + d, k, "lean", to=-6, dur=0.2)
    act(THROW + d + 0.5, k, "lean", to=0, dur=0.3)
    REL[k] = round(THROW + d + 0.16, 3)
    sfx(REL[k], "whoosh", 0.25, dur=0.3)

# ---------------------------------------------------------------- 12.95  the door bursts open: the Samurai
BURST = round(THROW + 0.12 + 0.16 + 0.07, 3)
SLOW = 0.07                      # the rolls' clock during the slow motion
STEP_OUT = BURST + 2.8
SLD = 0.17
SL = [STEP_OUT + 0.35, STEP_OUT + 0.67, STEP_OUT + 0.99]
CLICK = round(SL[2] + 0.8, 3)     # the blade goes down, the rolls fall apart
prop(BURST, "door", 0.16, ease="out", open=1.2)   # flung wide, flat to the wall: clear of the blade
sfx(BURST, "slam", 0.5)
sfx(BURST + 0.05, "sting", 0.4)
for k, d in (("witch", 0.0), ("pumpkin", 0.03), ("ghost", 0.05)):
    act(BURST + 0.05 + d, k, "expr", expr="shocked" if k == "pumpkin" else "sad", set=None if k == "pumpkin" else {"eye": 1.2, "open": 0.6, "pupil": 0.6, "tilt": 0.4}, dur=0.1)
    act(BURST + 0.05 + d, k, "look", to=[-0.5, 0.3], dur=0.1, blink=False)
    act(BURST + 0.2, k, "still", dur=CLICK - BURST - 0.1, idle=0.0, fade=0.3)
act(BURST, "sam", "still", dur=1.6, idle=0.1)
act(BURST + 1.25, "sam", "face", lid=0.42, brow=-0.5, dur=0.4)   # the eyes narrow on the push-in
act(BURST + 1.25, "sam", "look", to=[0.35, 0.05], dur=0.4, blink=False)
GLINT = BURST + 2.45
at(GLINT, fx="glint", who="sam", dur=0.6, size=0.22)
sfx(GLINT, "shing", 0.5)
# step out and slash
act(STEP_OUT, "sam", "move", to=SAM_OUT, dur=0.3, ease="inOut")
act(STEP_OUT, "sam", "arm", side="L", pose={"o": [0.06, 0.08, -0.32]}, dur=0.3)   # the free hand back behind him, clear of the cut rolls
act(STEP_OUT, "sam", "face", lid=0.3, brow=-0.6, dur=0.2)
CUT_AT = [0.8, 0.3, 0.75]      # where in each swing the blade meets its roll (late in the first, early in the second...)
act(STEP_OUT + 0.05, "sam", "arm", side="R", pose=WIND, dur=0.25, ease="inOut")
act(STEP_OUT + 0.05, "sam", "tilt", to=[0, 0], dur=0.25)
for i, (t, pose, tl) in enumerate([(SL[0], ACROSS, [70, -60]), (SL[1], HIGH, [0, -10]), (SL[2], LOW, [60, -100])]):
    act(t, "sam", "arm", side="R", pose=pose, dur=SLD, ease="inOut")
    act(t, "sam", "tilt", to=tl, dur=SLD, ease="inOut")
    act(t, "sam", "lean", to=[-8, 6, -10][i], dur=SLD)
    at(t, fx="trail", who="sam", dur=SLD, len=0.07, color="#7dffb4", **{"from": 0.6})
    sfx(t, "whoosh", 0.45, dur=0.2)
act(SL[2] + 0.2, "sam", "still", dur=CLICK - SL[2] - 0.2, idle=0.05, fade=0.1)
act(SL[2] + 0.3, "sam", "lean", to=0, dur=0.5)
# the blade goes down with a click, and everything he cut falls apart
# the blade stays low where the last cut ended: a small flick on the click (it never crosses his face up close)
act(CLICK - 0.1, "sam", "tilt", to=[48, -92], dur=0.1, ease="out")
act(CLICK - 0.3, "sam", "face", lid=0.55, dur=0.25)
sfx(CLICK, "click", 0.5)

# ---------------------------------------------------------------- the kids run, the witch comes back
RUN = CLICK + 0.75
for k, d in (("witch", 0.22), ("pumpkin", 0.1), ("ghost", 0.0)):
    act(RUN - 0.25 + d, k, "expr", expr="shocked", set={"open": 1.0}, dur=0.08) if k == "ghost" else act(RUN - 0.25 + d, k, "expr", expr="sad", set={"eye": 1.25, "open": 1.0, "pupil": 0.55}, dur=0.08)
    act(RUN - 0.2 + d, k, "hop", height=0.12, dur=0.25)
    act(RUN + 0.05 + d, k, "turn", to=90, dur=0.15)
    act(RUN + 0.1 + d, k, "move", to={"witch": [2.7, 0.4], "pumpkin": [3.1, 0.95], "ghost": [3.5, 0.15]}[k], dur=0.75, ease="in", steps=4.5)
say(RUN - 0.2, "ghost", "AAAAH!", tone="excited", caption=False)
cap(RUN - 0.2, "AAAAH!", 1.0)
# the Samurai goes back in, the door shuts
# the blade stays low as he turns and walks back in (raising it would sweep it across his face)
act(RUN + 0.35, "sam", "turn", to=180, dur=0.35)
act(RUN + 0.6, "sam", "move", to=INSIDE, dur=0.5, ease="inOut")
prop(RUN + 1.05, "door", 0.4, ease="inOut", open=0)
sfx(RUN + 1.45, "land", 0.35)
act(RUN + 1.6, "sam", "hide")
# the witch tiptoes back and knocks (the loop)
BACK = RUN + 1.7
for k, home, face in (("pumpkin", P0, -35), ("ghost", G0, -48)):
    # they follow the witch, a step behind her, so nobody's path crosses
    act(BACK + 0.15, k, "turn", to=-90, dur=0.01)
    act(BACK + 0.15, k, "expr", expr="eager", dur=0.2)
    act(BACK + 0.15, k, "move", to=home, dur=0.85, ease="out", steps=3.5)
    act(BACK + 0.8, k, "turn", to=face, dur=0.2)
    act(BACK + 0.8, k, "look", to=[-0.5, 0.15], dur=0.2, blink=False)
act(BACK + 0.35, "witch", "look", to=[0, 0.2], dur=0.15, blink=False)
act(BACK, "witch", "turn", to=-72, dur=0.01)
act(BACK, "witch", "move", to=KNOCK_AT, dur=0.85, ease="out", steps=3)
act(BACK, "witch", "expr", expr="eager", dur=0.2)
act(BACK, "witch", "arm", side="L", pose=BUCKET, dur=0.2)
act(BACK + 0.6, "witch", "arm", side="R", pose=KNOCK_OUT, dur=0.25)
act(BACK + 0.7, "witch", "look", to=[-0.4, 0.1], dur=0.15, blink=False)
END = BACK + 1.05
for t in (BACK + 0.95,):
    act(t, "witch", "arm", side="R", pose=KNOCK_IN, dur=0.1, ease="linear")
    sfx(t + 0.1, "knock", 0.55)

# ---------------------------------------------------------------- props placed from the layout
def frame_of(t):
    if not lay:
        return None
    fr = lay.get("aims", []) + lay["samples"]
    best = min(fr, key=lambda f: abs(f["t"] - t))
    return best


def actor(f, who):
    return next((a for a in f["actors"] if a["id"] == who), None)


def prop_at(f, pid):
    return next((p for p in f["props"] if p["id"] == pid), None)


G = -9.8


def ballistic(p0, p1, T, g=G):
    """velocity that takes p0 to p1 in T seconds under gravity"""
    return [(p1[0] - p0[0]) / T, (p1[1] - p0[1] - 0.5 * g * T * T) / T, (p1[2] - p0[2]) / T]


# the sweet: from the bowl's lip into the witch's bucket
f0 = frame_of(0.1)
fc = frame_of(CANDY_T)
if f0 and fc:
    b0 = prop_at(f0, "bowl")["at"]
    act(0.0, "reaper", "grab", prop="candy", hand="L", keep=True, pose=None)
    props[2].update({"x": b0[0] + 0.03, "y": b0[1] + 0.105, "z": b0[2] + 0.05})
    buck = prop_at(frame_of(CANDY_T + 0.42), "b_witch")["at"]
    act(CANDY_T, "reaper", "release", prop="candy", to=[buck[0], buck[1] + 0.05, buck[2]], dur=0.42, arc=0.18, ease="linear")
    act(CANDY_T + 0.43, "witch", "grab", prop="candy", hand="L", keep=True, pose=None)
    at(CANDY_T + 0.42, fx="glint", pos=[buck[0], buck[1] + 0.12, buck[2]], dur=0.45, size=0.08)
    for k, rid in ROLLS.items():
        bk = prop_at(f0, BUCKETS[k][0])["at"]
        pr = next(p for p in props if p["id"] == rid)
        pr.update({"x": bk[0], "y": bk[1] + 0.015, "z": bk[2], "rot": 0})
        act(0.0, k, "grab", prop=rid, hand="L", keep=True, pose=None)

# the rolls' flights: thrown from the hand, slow from the burst, cut in the slashes, fall apart at the click
WARP = [(BURST, 0.03), (STEP_OUT, 0.3), (SL[2] + SLD + 0.1, 0.03), (CLICK, 1.0)]   # from each time on, the rolls' clock runs at this rate


def clock(t):
    """the rolls' clock: real time, then nearly frozen for the reveal, slow for the slashes, frozen again until the click"""
    c, prev, rate = 0.0, 0.0, 1.0
    for t1, r1 in WARP:
        if t <= t1:
            return c + (t - prev) * rate
        c += (t1 - prev) * rate
        prev, rate = t1, r1
    return c + (t - prev) * rate


ORDER = ["witch", "pumpkin", "ghost"]
contact = {}
SPLIT_AT = []
if lay:
    for i, k in enumerate(ORDER):
        fs = frame_of(SL[i] + SLD * CUT_AT[i])
        s = actor(fs, "sam")
        if s and s.get("prop"):
            a, b = s["prop"]["a"], s["prop"]["b"]
            u = 0.9
            contact[k] = [a[j] + (b[j] - a[j]) * u for j in range(3)]

if lay and len(contact) == 3:
    for i, k in enumerate(ORDER):
        rid = ROLLS[k]
        t0 = REL[k]
        hand = actor(frame_of(t0), k)["hands"]["R"]
        R = 0.062 * 0.85
        p0 = [hand[0], hand[1] - 0.12 * 0.85 + 0.01, hand[2]]          # the roll's bottom under the hand's grip
        c = contact[k]
        c = [c[0], c[1] - R, c[2]]                                    # the roll's middle on the blade
        ts = SL[i] + SLD * CUT_AT[i]
        T = clock(ts) - clock(t0)
        v = ballistic(p0, c, T)
        act(t0, k, "release", prop=rid, to=[round(p0[0] + v[0] / FPS, 4), round(p0[1] + v[1] / FPS + 0.5 * G / FPS / FPS, 4), round(p0[2] + v[2] / FPS, 4)], dur=round(1 / FPS, 4), ease="linear")
        spin = [540, -480, 620][i]                                   # degrees a second of tumble (tip)
        rot0 = [-30, 25, -15][i]
        tsplit = CLICK + 0.04 * i
        t = t0 + 1 / FPS
        last = None
        while t < tsplit - 1e-6:
            # once cut, a roll all but stops in the air (a tenth of the slow motion) until the click
            tn = t + 1 / FPS
            tau = clock(min(tn, ts)) - clock(t0) + (0.1 * (clock(tn) - clock(ts)) if tn > ts else 0)
            p = [p0[j] + v[j] * tau + (0.5 * G * tau * tau if j == 1 else 0) for j in range(3)]
            st = {"x": round(p[0], 4), "y": round(p[1], 4), "z": round(p[2], 4), "tip": round(spin * tau, 2), "rot": rot0}
            prop(t, rid, round(1 / FPS, 4), ease="linear", **st)
            last = (p, spin * tau)
            t = round(t + 1 / FPS, 4)
        # fall apart: the halves part and drop straight down onto the porch, landing flat
        p, tip = last
        SPLIT_AT.append(p)
        y0, fall = p[1], math.sqrt(max(0.01, 2 * p[1] / 9.8))
        fall = max(0.22, fall)
        land_tip = round(tip / 180) * 180
        prop(tsplit, rid, 0.25, ease="out", split=1)
        prop(tsplit, rid, fall, ease="in", y=0.012, tip=land_tip)
        prop(tsplit + fall, rid, 0.12, ease="settle", squash=0.0)
        sfx(tsplit + fall, "land", 0.3)

# ---------------------------------------------------------------- the camera: one continuous move
WIDE = {"pos": [0.36, 0.82, 6.0], "look": [0.30, 0.76, -0.30], "fov": 36}
CLOSE_DOOR = {"pos": [0.0, 0.95, 4.6], "look": [0.12, 0.75, -0.6], "fov": 34}
FACE = {"pos": [-0.18, 0.86, 0.05], "look": [-0.30, 0.78, -1.35], "fov": 30}
HILT = {"pos": [-0.42, 0.66, -0.1], "look": [-0.58, 0.62, -1.0], "fov": 30}
TIP = {"pos": [-0.40, 1.42, -0.12], "look": [-0.58, 1.35, -1.0], "fov": 30}
CANDY_CAM = {"pos": [0.32, 0.72, 3.3], "look": [0.06, 0.48, -0.5], "fov": 34}
SLASH = {"pos": [-0.12, 1.1, 4.5], "look": [-0.25, 1.02, -0.36], "fov": 36}
OPEN = {"pos": [0.08, 0.92, 4.4], "look": [0.0, 0.70, -0.6], "fov": 34}
KIDS_CAM = {"pos": [0.9, 1.35, 3.6], "look": [0.85, 0.45, 0.1], "fov": 34}   # a little high, over the pumpkin
CUTS = {"pos": [0.2, 0.62, 2.4], "look": [0.05, 0.35, -0.15], "fov": 34}
if SPLIT_AT:
    cx = sum(p[0] for p in SPLIT_AT) / len(SPLIT_AT); cy = sum(p[1] for p in SPLIT_AT) / len(SPLIT_AT); cz = sum(p[2] for p in SPLIT_AT) / len(SPLIT_AT)
    mx, mz = (cx + SAM_OUT[0]) / 2, (cz + SAM_OUT[1]) / 2
    CUTS = {"pos": [round(mx + 0.15, 3), round(0.85, 3), round(mz + 3.3, 3)], "look": [round(mx, 3), round(0.65, 3), round(mz, 3)], "fov": 34}


def key(t, k, stop=False):
    d = {"at": round(t, 3), **json.loads(json.dumps(k))}
    if stop:
        d["stop"] = True
    return d


camera = [
    key(0, OPEN, True),
    key(0.9, OPEN, True),
    key(1.6, WIDE, True),
    key(4.1, {**WIDE, "pos": [0.30, 0.82, 5.5]}),
    key(4.75, CANDY_CAM, True),
    key(6.55, CANDY_CAM, True),
    key(7.4, {**WIDE, "pos": [0.24, 0.84, 5.3]}),
    key(9.8, CLOSE_DOOR, True),
    key(10.4, CLOSE_DOOR, True),
    key(11.5, KIDS_CAM, True),
    key(12.5, KIDS_CAM, True),
    key(BURST, WIDE, True),
    key(BURST + 1.15, FACE, True),
    key(BURST + 1.65, FACE, True),
    key(BURST + 2.0, HILT),
    key(BURST + 2.45, TIP, True),
    key(BURST + 2.6, TIP, True),
    key(STEP_OUT + 0.35, SLASH, True),
    key(CLICK - 0.5, SLASH, True),
    key(CLICK + 0.35, CUTS, True),
    key(CLICK + 0.55, CUTS, True),
    key(RUN + 0.6, WIDE, True),
    key(BACK + 0.1, WIDE, True),
    key(END, OPEN, True),
]

# ---------------------------------------------------------------- beats (for the reviews and contact sheets)
BEATS = [
    ("knock knock", 0.0, "hook"), ("the door opens", 0.95, None), ("nice costume", 2.7, None), ("one sweet", 4.4, None),
    ("knock again", 7.5, "escalation"), ("slam", 9.7, None), ("trick it is", 10.4, None), ("the throw", 12.4, None),
    ("the door bursts open", BURST, None), ("the blade", BURST + 1.9, None), ("three slashes", STEP_OUT, None),
    ("the click", CLICK - 0.4, None), ("they run", RUN, None), ("knock again (loop)", BACK, None),
]
items.sort(key=lambda x: x[0])
beats = []
for i, (name, start, kind) in enumerate(BEATS):
    end = BEATS[i + 1][1] if i + 1 < len(BEATS) else END
    mine = [dict(it, at=round(t - start, 3)) for t, it in items if (t >= start - 1e-6) and (i + 1 == len(BEATS) or t < BEATS[i + 1][1] - 1e-6)]
    b = {"name": name, "at": round(start, 3), "len": round(end - start, 3), "do": mine}
    if kind == "escalation":
        b["kind"] = kind
    beats.append(b)

AIM = sorted(set([0.1, CANDY_T, round(CANDY_T + 0.42, 3)] + list(REL.values()) + [round(t + SLD * CUT_AT[i], 3) for i, t in enumerate(SL)]))
sb = {
    "id": "trick-or-treat",
    "title": "Trick or treat",
    "format": "knock -> one sweet -> knock again -> slam -> toilet roll revenge -> the Samurai -> slow-motion reveal -> delayed cut -> they run -> knock (loop)",
    "idea": "Jonny, 25 Oct 2026",
    "fps": FPS,
    "look": "anime-pro",
    "profile": "short",
    "cover": round(SL[0] + 0.2, 2),
    "creative": {"length": [12, 24]},
    "set": {"type": "porch", "seed": 7},
    "music": {"style": "sneaky"},
    "cast": cast,
    "props": props,
    "camera": camera,
    "beats": beats,
    "aimAt": AIM,
    "notes": "Generated by storyboards/halloween/make-trick-or-treat.py. Kids are extras (characters/kids), not fighters.",
}
(here / "trick-or-treat.json").write_text(json.dumps(sb, indent=1) + "\n")
print(f"wrote storyboards/halloween/trick-or-treat.json  ({END:.2f} s, layout {'used' if lay else 'not found: run --layout and run me again'})")
