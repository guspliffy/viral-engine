# Widens the finished TALL pyramids storyboards (1080x1920) into WIDE ones (1920x1080) for the YouTube film, with no
# change to story, timing, acting or sound: only the cameras and the on-screen text move.
#   python3 storyboards/series/ancient-aliens/01-pyramids/wide/widen.py   -> wide/<id>-wide.json for the five storyboards
# Camera: the wide frame shows a window of the tall frame's height (K of it, centred C below the middle, so feet and
# hands stay in and the empty caption sky goes) and the scene simply continues to the left and right of it.
# fov is vertical, so the new fov is that window's angle and the camera tilts down by the window's offset.
# Text: subtitles and numbers move up into the wide frame's top (order kept), labels into the top corners.
import json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); BASE = os.path.dirname(HERE)
SRC = ["block-a/aa-01-block-a.json", "block-b/aa01-block-b.json", "block-c/aa01-c-day.json", "block-c/aa01-c-late.json", "block-d/aa01-block-d.json"]
K = float(os.environ.get("WIDE_K", 0.7)); C = float(os.environ.get("WIDE_C", -0.25))
OVR = json.load(open(os.path.join(HERE, "overrides.json"))) if os.path.exists(os.path.join(HERE, "overrides.json")) else {}

def widen_cam(pos, look, fov, k=K, c=C):
    t = math.tan(math.radians(fov) / 2)
    lo, hi = math.atan((c - k) * t), math.atan((c + k) * t)
    nf = math.degrees(hi - lo); d = (hi + lo) / 2                     # the window's angle and its centre's tilt
    v = [look[i] - pos[i] for i in range(3)]; h = math.hypot(v[0], v[2]); L = math.hypot(h, v[1])
    p = math.atan2(v[1], h) + d
    hx, hz = (v[0] / h, v[2] / h) if h > 1e-9 else (0.0, -1.0)
    if h <= 1e-9:   # straight down/up (a top view): tilt toward -z on the picture's vertical
        return look[:], round(nf, 3)
    nl = [pos[0] + L * math.cos(p) * hx, pos[1] + L * math.sin(p), pos[2] + L * math.cos(p) * hz]
    return [round(x, 4) for x in nl], round(nf, 3)

def text_y(y): return max(46, round((y - 300) * 0.59 + 95))
def text_size(s): return round(s * 0.87) if s <= 70 else round(s * 0.95)
def text_x(x): return round(x * 0.84) if x < 540 else (960 if x == 540 else round(1920 - (1080 - x) * 0.84))

for rel in SRC:
    sb = json.load(open(os.path.join(BASE, rel)))
    sid = sb["id"]; sb["id"] = sid + "-wide"; sb["frame"] = "wide"; sb.pop("captionBand", None)
    for b in sb["beats"]:
        s = b.get("shot")
        if not s: continue
        o = OVR.get(sid, {}).get(b["name"], {})
        k, c = o.get("k", K), o.get("c", C)
        tall = json.loads(json.dumps(s))
        s["look"], s["fov"] = widen_cam(tall["pos"], tall["look"], tall["fov"], k, c)
        to = s.get("to")
        if to:
            tp = to.get("pos", tall["pos"]); tl = to.get("look", tall["look"]); tf = to.get("fov", tall["fov"])
            nl, nf = widen_cam(tp, tl, tf, k, c)
            if "look" in to or "pos" in to: to["look"] = nl
            if "fov" in to: to["fov"] = nf
        for key in ("pos", "look"):       # a hand-set camera for one beat wins
            if key in o: s[key] = o[key]
        if "fov" in o: s["fov"] = o["fov"]
    orig = [dict(c) for c in sb["captions"]]
    for cap in sb["captions"]:
        cap["pos"] = text_y(cap["pos"]); cap["size"] = text_size(cap["size"])
        if "x" in cap:   # a label goes to its corner; a number set over a thing in the picture follows that thing
            cap["x"] = text_x(cap["x"]) if cap.get("style") == "label" else round(960 + (cap["x"] - 540) / 540 * 960 * (9 / 16) / (K * 16 / 9))
    # two texts on screen together keep their tall spacing (scaled like the type), so a stacked pair never overlaps
    order = sorted(range(len(orig)), key=lambda i: orig[i]["pos"])
    for n, j in enumerate(order):
        for i in order[:n]:
            a, b = orig[i], orig[j]
            if a["from"] < b["to"] and b["from"] < a["to"] and a.get("style") != "label" and b.get("style") != "label":
                need = sb["captions"][i]["pos"] + round((b["pos"] - a["pos"]) * 0.92)
                if sb["captions"][j]["pos"] < need: sb["captions"][j]["pos"] = need
    out = os.path.join(HERE, f"{sid}-wide.json")
    json.dump(sb, open(out, "w"), indent=1); print(out)
