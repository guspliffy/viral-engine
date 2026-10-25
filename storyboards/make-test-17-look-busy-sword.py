# "Look busy", rewritten (Jonny, 25 Oct): one continuous office scene. The boss is coming, the Sorcerer makes the
# Samurai look busy, and his sword hand starts slicing on its own: the unfinished report goes to confetti, the boss sees
# a flurry of "work" and promotes him with a MANAGER nameplate, and the sword cuts the nameplate in two.
# Structure from the outside review (no time jump, boss in the same scene, nameplate promotion, small local spell,
# deadpan ending); the sword stays because the Samurai slices everything (character bible).
# Run: python3 storyboards/make-test-17-look-busy-sword.py  -> storyboards/test-17-look-busy-sword.json
import json, pathlib
here = pathlib.Path(__file__).parent

HERO, MAG = [0.0, 0.0], [0.8, -0.6]
DESK = {"id": "desk", "kind": "desk", "x": -0.18, "y": 0, "z": 0.63, "w": 1.55}
REPORT = [-0.6, 0.42, 0.6]
PLATE = [-0.8, 0.42, 0.76]   # where the boss puts the nameplate (under the last cut)
PGRIP = [-0.15, 0.03, -0.06]   # the boss holds the nameplate by its near end, from behind the top edge
BOSS_WATCH, BOSS_GIVE = [-2.0, 0.95], [-1.5, 0.85]   # watching: a body-width clear of the blade tip

# the sword hand (R; the hand at -x facing the camera). Raised beside the head, and the cut: a diagonal across the
# desk, the blade down and out over the report, the forearm square to it (probes 25 Oct: no arm through the blade)
UP = ({"o": [0.38, 0.84, 0.16]}, [0, 15])
CUT = ({"o": [0.1, 0.55, 0.48]}, [15, 112])
HOVER = ({"o": [0.3, 0.72, 0.3]}, [-25, 30])  # held up while the boss is close: the blade back over the shoulder
HIGH = ({"o": [0.42, 0.95, 0.2]}, [-10, 20])   # higher while he puts the nameplate down: the fist above his reach (Fable A)
HANG = {"o": [0.15, 0.27, 0.08]}   # a hanging free hand that doesn't flip the mitten (look busy remake)
SHOCK = {"curve": -0.6, "open": 0.7}   # the Samurai's own "shocked" mouth turns up and reads as a grin

beats, fx, sfx, props = [], [], [], [DESK,
    {"id": "report", "kind": "report", "x": REPORT[0], "y": REPORT[1], "z": REPORT[2], "rot": 6, "batches": 5},
    {"id": "phone", "kind": "phone", "x": 0.42, "y": 0.426, "z": 0.7, "rot": -20, "tip": -90},   # an office desk at a glance
    {"id": "plate", "kind": "nameplate", "x": -2.9, "y": 0.4, "z": 0.9, "rot": 90}]


def beat(name, at, length, shot=None, kind=None):
    b = {"name": name, "at": at, "len": length, "do": []}
    if shot: b["shot"] = shot
    if kind: b["kind"] = kind
    beats.append(b)
    return lambda t, **item: b["do"].append({**item, "at": round(t - at, 3)})


def arm(put, t, who, side, pose, dur, ease=None):
    put(t, who=who, do="arm", side=side, pose=pose, dur=dur, **({"ease": ease} if ease else {}))


def sword(put, t, p, dur):
    pose, tilt = p
    arm(put, t, "hero", "R", pose, dur)
    put(t, who="hero", do="tilt", to=tilt, dur=dur)


def cut(put, t, z=0.4):
    """one stroke: up (antic) is already held; down fast, a smear, a whoosh; back up"""
    sword(put, t, CUT, 0.12)
    fx.append({"do": "slash", "at": round(t + 0.01, 3), "pos": [-0.6, 0.85, z], "r": 0.88, "from": 108, "arc": 100, "dur": 0.16})
    sfx.append({"sound": "whoosh", "at": round(t, 3), "gain": 0.22, "dur": 0.2})


# --- 1. hook: the boss is coming (full faces, desk and report in frame) ---
p = beat("boss is coming", 0, 1.0, shot={"pos": [0.2, 1.6, 5.7], "look": [0.2, 0.9, 0.1], "fov": 36,
                                          "to": {"pos": [0.2, 1.56, 5.4]}, "dur": 2.4, "ease": "out"})
p(0.0, who="hero", do="turn", to="camera", dur=0.15)   # frame 0 mid-whip: he was chatting with the Sorcerer
p(0.0, who="hero", do="look", to=[-0.9, 0.05], dur=0.08, blink=False)
p(0.0, who="hero", do="expr", expr="shocked", set=SHOCK, dur=0.08)
p(0.05, macro="say", who="hero", line="boss is coming.", tone="excited", dur=0.75, caption=False)
p(0.05, caption="boss is coming.", len=0.9, pos="top")
p(0.25, who="mag", do="look", to=[-0.8, 0.05], dur=0.15, blink=False)

# --- 2. the wish ---
p = beat("make me look busy", 1.0, 1.1)
p(1.0, who="hero", do="look", to=[0.8, 0.12], dur=0.12, blink=False)
p(1.0, who="hero", do="expr", expr="eager", dur=0.2)
arm(p, 1.0, "hero", "L", {"o": [0.12, 0.45, 0.3]}, 0.3)
p(1.05, macro="say", who="hero", line="make me look busy.", tone="excited", dur=0.95, caption=False)
p(1.05, caption="make me look busy.", len=1.15, pos="top")
p(1.25, who="mag", do="look", to=[-0.6, 0.0], dur=0.12, blink=False)
p(1.6, who="mag", do="expr", expr="cocky", dur=0.2)
arm(p, 2.0, "hero", "L", HANG, 0.4)

# --- 3. the spell: one wrist flick, a small green pulse into the sword hand, the hand jerks up ---
p = beat("the flick", 2.1, 0.85)
arm(p, 2.1, "mag", "L", "cast", 0.35, "out")   # the orb hand: one flick toward him (the remake's clean cast)
arm(p, 2.75, "mag", "L", "hold", 0.5)
fx.append({"do": "poof", "at": 2.42, "pos": [-0.55, -0.05, 0.35], "color": "#9dffb0", "spark": "#7dff9a", "puffs": 2, "sparks": 14, "dur": 0.6})
sfx.append({"sound": "pop", "at": 2.42, "gain": 0.35})
sword(p, 2.48, UP, 0.16)
p(2.48, who="hero", do="expr", expr="shocked", set=SHOCK, dur=0.08)
p(2.5, who="hero", do="look", to=[-0.7, 0.5], dur=0.08, blink=False)
p(2.6, who="mag", do="expr", expr="smug", dur=0.3)

# --- 4. the slicing: three cuts over the report, a beat, then it falls apart into confetti ---
p = beat("slicing", 2.95, 2.7, shot={"pos": [-0.42, 1.55, 5.0], "look": [-0.42, 0.72, 0.3], "fov": 36,
                                      "to": {"pos": [-0.42, 1.5, 4.7]}, "dur": 2.7, "ease": "inOut"})
for t in (3.0, 3.5, 4.0):
    cut(p, t); sword(p, t + 0.24, UP, 0.16)
p(3.15, who="hero", do="look", to=[-0.6, -0.4], dur=0.1, blink=False)
# the iaido beat (Fable A): the blade stays up, he looks at the report, and only then it falls apart
p(4.2, who="hero", do="look", to=[-0.5, -0.45], dur=0.12, blink=False)
p(4.45, do="prop", id="report", set={"shred": 1}, dur=0.8, ease="linear")
fx.append({"do": "poof", "at": 4.45, "pos": [REPORT[0], -0.05, REPORT[2]], "color": "#ffffff", "spark": "#ffffff", "puffs": 0, "sparks": 18, "dur": 0.9})
sfx.append({"sound": "shing", "at": 4.45, "gain": 0.3})
p(4.5, who="hero", do="expr", expr="deadpan", dur=0.4)
p(4.75, who="hero", do="look", to=[0, 0], dur=0.2, blink=False)
for t in (4.95,):
    cut(p, t); sword(p, t + 0.24, UP, 0.16)

# --- 5. he sees it: eyes to the confetti, to the hand, back to us; the hand keeps going ---
p = beat("he sees it", 5.65, 1.0, shot={"pos": [-0.28, 1.3, 3.5], "look": [-0.3, 0.74, 0.3], "fov": 36})
p(5.7, who="hero", do="look", to=[-0.6, -0.45], dur=0.15, blink=False)
cut(p, 5.75); sword(p, 5.99, UP, 0.16)
p(6.1, who="hero", do="look", to=[-0.7, 0.45], dur=0.15, blink=False)
cut(p, 6.25); sword(p, 6.49, UP, 0.16)
p(6.5, who="hero", do="look", to=[0, 0], dur=0.15, blink=False)

# --- 6. the boss walks in with something under his arm; the slicing goes on ---
p = beat("the boss", 6.65, 1.75, shot={"pos": [-0.85, 1.5, 7.0], "look": [-0.85, 0.75, 0.4], "fov": 48})   # the Sorcerer in too (Fable B)
p(6.65, who="boss", do="move", to=BOSS_WATCH, dur=1.0, ease="out")
p(7.45, who="mag", do="look", to=[-0.6, 0.0], dur=0.15, blink=False)   # her smug look at the flurry (Fable B)
for t in (6.85, 7.35):
    cut(p, t); sword(p, t + 0.24, UP, 0.16)
p(7.4, who="boss", do="look", to=[0.5, -0.2], dur=0.15, blink=False)   # the flurry first
p(7.6, who="boss", do="turn", to=40, dur=0.5, ease="settle")   # toward the Samurai, not the camera
p(7.7, who="boss", do="look", to=[0.6, 0.3], dur=0.15, blink=False)
cut(p, 7.85); sword(p, 8.09, UP, 0.16)
p(8.1, who="boss", do="look", to=[0.7, 0.05], dur=0.15, blink=False)

# --- 7. judgement: skeptical, then approving; the hand stops, held up; a weak professional smile ---
p = beat("judgement", 8.4, 1.0)
sword(p, 8.4, HOVER, 0.35)
p(8.45, who="hero", do="look", to=[-0.8, 0.05], dur=0.15, blink=False)
p(8.55, who="hero", do="expr", expr="kind", dur=0.3)
p(8.6, who="boss", do="expr", expr="kind", dur=0.35)
p(8.95, macro="nod", who="boss")

# --- 8. the reward: he steps in and puts the nameplate down ---
p = beat("promoted", 9.4, 2.0)
sword(p, 9.3, HIGH, 0.4)
p(9.4, who="boss", do="move", to=BOSS_GIVE, dur=0.55, ease="inOut")
p(10.3, who="hero", do="look", to=[-0.6, -0.4], dur=0.15, blink=False)
p(9.6, do="prop", id="plate", set={"rot": 0}, dur=0.5)
arm(p, 9.95, "boss", "L", {"prop": "plate", "grip": PGRIP, "at": [PLATE[0], PLATE[1] + 0.04, PLATE[2]]}, 0.4, "inOut")
arm(p, 10.35, "boss", "L", {"prop": "plate", "grip": PGRIP, "at": PLATE}, 0.2, "out")
p(10.55, do="prop", id="plate", set={"squash": 0.05}, dur=0.05, ease="out")
p(10.6, do="prop", id="plate", set={"squash": 0}, dur=0.15, ease="settle")
sfx.append({"sound": "click", "at": 10.55, "gain": 0.5})
p(10.65, who="boss", do="release", prop="plate", dur=0)
arm(p, 10.7, "boss", "L", HANG, 0.45, "settle")
p(10.7, macro="say", who="boss", line="promoted.", tone="calm", dur=0.6, caption=False)
p(11.0, who="boss", do="move", to=BOSS_WATCH, dur=0.5, ease="inOut")

# --- 9. it lands: MANAGER; he brightens ---
p = beat("manager", 11.4, 1.0, shot={"pos": [-0.5, 1.1, 3.6], "look": [-0.5, 0.66, 0.5], "fov": 36})
p(11.4, who="hero", do="look", to=[-0.5, -0.5], dur=0.15, blink=False)
p(11.5, who="hero", do="expr", expr="delighted", dur=0.25)

# --- 10. the button: the hand winds up by itself, one clean cut through the nameplate, deadpan to us ---
p = beat("the cut", 12.4, 2.0, shot={"pos": [-0.3, 1.4, 4.7], "look": [-0.3, 0.72, 0.35], "fov": 36})
sword(p, 12.45, UP, 0.3)
p(12.6, who="hero", do="look", to=[-0.7, 0.5], dur=0.12, blink=False)
p(12.6, who="hero", do="expr", expr="shocked", set=SHOCK, dur=0.1)
cut(p, 12.9, z=0.85)   # the smear drawn in front of the nameplate: the cut goes through it
p(13.05, do="prop", id="plate", set={"split": 1}, dur=0.3, ease="settle")
sfx.append({"sound": "shing", "at": 13.0, "gain": 0.3})
fx.append({"do": "poof", "at": 13.05, "pos": [PLATE[0], -0.08, PLATE[2]], "color": "#d9c3a0", "spark": "#f3d27a", "puffs": 0, "sparks": 10, "dur": 0.7})
p(13.3, who="hero", do="look", to=[0, 0], dur=0.2, blink=False)
p(13.35, who="hero", do="expr", expr="deadpan", dur=0.35)

# --- 11. back out to the opening framing: the Sorcerer, smug, and the sword up again, so it loops (Fable A) ---
p = beat("loop", 13.4, 1.0, shot={"pos": [-0.3, 1.4, 4.7], "look": [-0.3, 0.72, 0.35], "fov": 36,
                                  "to": {"pos": [0.2, 1.6, 5.7], "look": [0.2, 0.9, 0.1]}, "dur": 1.0, "ease": "inOut"})
p(13.4, who="hero", do="still", dur=0.5, idle=0.2)
p(13.5, who="mag", do="look", to=[0, 0], dur=0.15, blink=False)
p(13.5, who="mag", do="expr", expr="smug", dur=0.25)
sword(p, 13.9, HOVER, 0.2)   # up through the held pose first: straight down to rest dipped the blade into the desk and
sword(p, 14.1, ("rest", [0, 8]), 0.3)   # flipped the hand (Fable B); then rest, as in frame 0
fx.append({"do": "poof", "at": 14.15, "pos": [PLATE[0], -0.05, PLATE[2]], "color": "#9dffb0", "spark": "#7dff9a", "puffs": 1, "sparks": 10, "dur": 0.25})   # her magic tidies the desk for the loop

# the boss carries the nameplate in from off screen (left hand, low, its face turned toward him: unreadable edge-on)
beats[0]["do"] += [{"who": "boss", "do": "grab", "prop": "plate", "hand": "L", "grip": PGRIP, "pose": {"o": [0.28, 0.42, 0.12]}, "dur": 0.01, "at": 0}]
for who, times in {"hero": [5.6, 9.3], "mag": [1.0, 4.0], "boss": [9.2]}.items():
    beats[0]["do"].append({"who": who, "do": "noblink", "at": 0})
    for t in times:
        b = max((b for b in beats if b["at"] <= t), key=lambda b: b["at"])
        b["do"].append({"who": who, "do": "blink", "at": round(t - b["at"], 3)})

sb = {
    "id": "test-17-look-busy-sword",
    "title": "Asked the sorcerer to make me look busy",
    "format": "boss alert -> wish -> flick -> the sword slices the report by itself -> boss promotes him -> the sword cuts the nameplate",
    "shares": "the work group chat",
    "fps": 30, "cover": 4.6, "loop": True, "look": "anime-pro",
    "set": {"type": "office", "seed": 3},
    "cast": [
        {"id": "hero", "character": "potatobrawl/samurai", "at": HERO, "face": 18, "expr": "shocked", "arms": {"R": "rest", "L": HANG}, "seed": 2.2},
        {"id": "mag", "character": "potatobrawl/sorcerer", "at": MAG, "face": "3q-left", "expr": "kind", "arms": {"R": "rest", "L": "hold"}, "seed": 5.7},
        {"id": "boss", "character": "potatobrawl/allfather", "at": [-2.9, 0.85], "face": "3q-right", "expr": "stern", "arms": {"R": "rest", "L": {"o": [0.28, 0.42, 0.12]}}, "seed": 3.3},
    ],
    "props": props, "beats": beats,
    "captions": [{"text": "promoted.", "from": 10.7, "to": 11.9, "pos": "top"}],   # past its beat: it holds over the MANAGER close-up
    "fx": fx, "sfx": sfx,
    "notes": "Rewrite of look busy (outside review + Jonny's pick 25 Oct): one scene, the sword slices the report, MANAGER nameplate, the last cut splits it.",
}
(here / "test-17-look-busy-sword.json").write_text(json.dumps(sb, indent=1) + "\n")
print("wrote storyboards/test-17-look-busy-sword.json")
