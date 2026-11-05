"""Draws a CMU take (tools/mocap/dump.mjs JSON) as a stick figure seen from the side of its travel, for reference
panels and contact sheets. Orthographic, ground line, the figure kept in frame (the camera follows the pelvis).
  python3 tools/mocap/stick.py <take.json> --sheet out.png [--every 0.5]
  python3 tools/mocap/stick.py <take.json> --frames out_dir [--size 640x1080] [--from 1.0 --to 6.0] [--yaw 0]
"""
import json, math, os, sys
from PIL import Image, ImageDraw

BONES = [("root", "lhipjoint"), ("lhipjoint", "lfemur"), ("lfemur", "ltibia"), ("ltibia", "lfoot"), ("lfoot", "ltoes"),
         ("root", "rhipjoint"), ("rhipjoint", "rfemur"), ("rfemur", "rtibia"), ("rtibia", "rfoot"), ("rfoot", "rtoes"),
         ("root", "lowerback"), ("lowerback", "upperback"), ("upperback", "thorax"), ("thorax", "lowerneck"),
         ("lowerneck", "upperneck"), ("upperneck", "head"), ("thorax", "lclavicle"), ("lclavicle", "lhumerus"),
         ("lhumerus", "lradius"), ("lradius", "lwrist"), ("lwrist", "lhand"), ("thorax", "rclavicle"),
         ("rclavicle", "rhumerus"), ("rhumerus", "rradius"), ("rradius", "rwrist"), ("rwrist", "rhand")]
LEFT = (90, 170, 255)
RIGHT = (255, 140, 70)
MID = (235, 235, 235)


def load(p):
    d = json.load(open(p))
    ix = {n: i for i, n in enumerate(d["names"])}
    return d, ix


def travel_yaw(d, ix):
    a, b = d["frames"][0][ix["root"]], d["frames"][-1][ix["root"]]
    return math.atan2(b[2] - a[2], b[0] - a[0])


def project(p, yaw, cx, cy, s, ox, oz):
    # look along the axis square to the travel: travel goes left to right on screen
    x, z = p[0] - ox, p[2] - oz
    u = x * math.cos(yaw) + z * math.sin(yaw)
    return (cx + s * u, cy - s * p[1])


def draw(img, d, ix, k, yaw, s, cx, cy, follow=True, label=None):
    dr = ImageDraw.Draw(img)
    F = d["frames"][k]
    r = F[ix["root"]]
    ox, oz = (r[0], r[2]) if follow else (0, 0)
    floor = min(f[1] for f in F)
    dr.line([(0, cy - s * 0.0), (img.width, cy)], fill=(80, 80, 80), width=2)
    for a, b in BONES:
        pa, pb = project(F[ix[a]], yaw, cx, cy, s, ox, oz), project(F[ix[b]], yaw, cx, cy, s, ox, oz)
        col = LEFT if a.startswith("l") and a != "lowerback" and a != "lowerneck" else RIGHT if a.startswith("r") and a != "root" else MID
        dr.line([pa, pb], fill=col, width=max(3, int(s / 90)))
    h = project(F[ix["head"]], yaw, cx, cy, s, ox, oz)
    rr = s * 0.09
    dr.ellipse([h[0] - rr, h[1] - rr * 1.1, h[0] + rr, h[1] + rr * 0.9], outline=MID, width=max(3, int(s / 90)))
    if label:
        dr.text((10, 10), label, fill=(200, 200, 200))


def main():
    a = sys.argv[1:]
    path = a[0]
    opt = {a[i]: a[i + 1] for i in range(1, len(a) - 1, 2)}
    d, ix = load(path)
    yaw = float(opt["--yaw"]) * math.pi / 180 if "--yaw" in opt else travel_yaw(d, ix)
    fps = d["fps"]
    if "--sheet" in opt:
        every = float(opt.get("--every", "0.5"))
        ks = list(range(0, d["n"], max(1, round(every * fps))))
        cols = 10
        rows = (len(ks) + cols - 1) // cols
        W, H = 200, 300
        sheet = Image.new("RGB", (W * cols, H * rows), (20, 20, 24))
        for i, k in enumerate(ks):
            tile = Image.new("RGB", (W, H), (20, 20, 24))
            draw(tile, d, ix, k, yaw, 150, W / 2, H - 30, label=f"{k / fps:.1f}s")
            sheet.paste(tile, ((i % cols) * W, (i // cols) * H))
        sheet.save(opt["--sheet"])
    if "--frames" in opt:
        W, H = map(int, opt.get("--size", "640x1080").split("x"))
        t0, t1 = float(opt.get("--from", 0)), float(opt.get("--to", d["n"] / fps))
        os.makedirs(opt["--frames"], exist_ok=True)
        for j, k in enumerate(range(round(t0 * fps), min(d["n"], round(t1 * fps)))):
            img = Image.new("RGB", (W, H), (22, 22, 26))
            draw(img, d, ix, k, yaw, H * 0.55, W / 2, H * 0.86)
            img.save(os.path.join(opt["--frames"], f"{j:05d}.png"))


main()
