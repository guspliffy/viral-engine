"""Compose tools/pebble/views.sh renders: rows front / three-quarter / left profile, columns your pack | colour |
plain-shaded | silhouette, every figure at the same cap-top-to-sole height on one ground line (matched.py's scaling)."""
import argparse, glob, math
from PIL import Image, ImageDraw, ImageFont
ap = argparse.ArgumentParser(); ap.add_argument("--dir"); ap.add_argument("--H", type=float); ap.add_argument("--px", type=int, default=520)
ap.add_argument("--pack", default="/mnt/project-files/characters/pebble/garden-guardian/01-turnaround.png"); a = ap.parse_args()
PX = a.px; CW, CH = int(PX * 1.12), int(PX * 1.5); TOP = int(PX * 0.42); BG = (250, 244, 232)
def cell(im, cx, cap, sole, bg=BG):
    k = PX / (sole - cap); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    c = Image.new("RGB", (CW, CH), bg); c.paste(im, (round(CW / 2 - cx * k), round(TOP - cap * k))); return c
def row(y, Hh=1920, fov=30):
    P, L = (0, 1.0, 6.2), (0, 0.92, 0); f = [L[i] - P[i] for i in range(3)]; n = math.sqrt(sum(v * v for v in f)); f = [v / n for v in f]
    u = [0, 1, 0]; d = sum(u[i] * f[i] for i in range(3)); u = [u[i] - d * f[i] for i in range(3)]; n = math.sqrt(sum(v * v for v in u)); u = [v / n for v in u]
    v = [-P[0], y - P[1], -P[2]]; z = sum(v[i] * f[i] for i in range(3)); yy = sum(v[i] * u[i] for i in range(3))
    return Hh / 2 - (yy / z) / math.tan(math.radians(fov / 2)) * Hh / 2
turn = Image.open(a.pack).convert("RGB")
packs = [cell(turn.crop((x0, 0, x1, 887)), cx - x0, 190, 647) for (x0, x1, cx) in [(20, 390, 205), (350, 730, 548), (700, 1060, 860)]]
cap, sole = row(a.H), row(0)
def one(pat):
    f = glob.glob(pat); assert f, pat; return f[0]
rows = []
for i, t in enumerate(("0.20", "1.20", "2.20")):
    col = Image.open(one(f"{a.dir}/colour/*-t{t}.png")).convert("RGB")
    clay = Image.open(one(f"{a.dir}/clay/*-t{t}.png")).convert("RGB")
    ids = Image.open(one(f"{a.dir}/colour/*-t{t}.ids.png")).convert("L").point(lambda v: 0 if v > 0 else 255).convert("RGB").resize(col.size, Image.NEAREST)
    w = col.width / 2
    rows.append([packs[i], cell(col, w, cap, sole), cell(clay, w, cap, sole), cell(ids, w, cap, sole, (255, 255, 255))])
LW = 40; TH = 40; sheet = Image.new("RGB", (LW + CW * 4, TH + CH * 3), (255, 255, 255)); d = ImageDraw.Draw(sheet)
try: F = ImageFont.truetype("assets/fonts/Inter-ExtraBold.otf", 22)
except Exception: F = None
for r, cs in enumerate(rows):
    for c, im in enumerate(cs): sheet.paste(im, (LW + c * CW, TH + r * CH))
    g = TH + r * CH + TOP + PX; d.line((LW, g, LW + CW * 4, g), fill=(200, 120, 90), width=1)
    lab = ["front", "three-quarter", "profile"][r]; txt = Image.new("RGBA", (CH, LW), (0, 0, 0, 0)); ImageDraw.Draw(txt).text((CH // 2, LW // 2), lab, font=F, fill=(90, 55, 30), anchor="mm"); rt = txt.rotate(90, expand=True); sheet.paste(rt, (0, TH + r * CH), rt)
for c, n in enumerate(["your pack", "colour", "plain-shaded", "silhouette"]): d.text((LW + c * CW + CW // 2, 10), n, font=F, fill=(90, 55, 30), anchor="mt")
sheet.save(f"{a.dir}/sheet.png"); print(f"{a.dir}/sheet.png", sheet.size)
