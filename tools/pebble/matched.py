"""Pebble matched sheet (review 7 Nov 2026): the pack's turnaround | an earlier engine render | the current one, view by
view, every figure scaled to the same cap-top-to-sole height on one ground line (not by fern height).
  python tools/pebble/matched.py --rejected <dir> --H 1.652 --current <dir> --H2 1.714 --out out/p3/matched.png
<dir> holds pebble-turnaround-anime-pro-t{0.20,1.20,2.20,3.20,4.20}.png from the turnaround bench (camera full: pos
[0, 1.0, 6.2], look [0, 0.92, 0], fov 30); H is the figure's sole-to-cap-top height in metres (tools/pebble/fit.mjs)."""
import argparse, math
from PIL import Image, ImageDraw, ImageFont
ap = argparse.ArgumentParser()
ap.add_argument("--pack", default="/mnt/project-files/characters/pebble/garden-guardian/01-turnaround.png")
ap.add_argument("--rejected"); ap.add_argument("--H", type=float); ap.add_argument("--current"); ap.add_argument("--H2", type=float)
ap.add_argument("--out", default="out/p3/matched.png"); ap.add_argument("--px", type=int, default=520)
a = ap.parse_args()
PX = a.px; CW, CH = int(PX * 1.12), int(PX * 1.5); TOP = int(PX * 0.42)   # cell size; cap top sits TOP px from the cell top
BG = (250, 244, 232)
def cell(im, cx, cap, sole):
    k = PX / (sole - cap); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    c = Image.new("RGB", (CW, CH), BG); c.paste(im, (round(CW / 2 - cx * k), round(TOP - cap * k))); return c
# the pack: cap top and sole rows measured on the turnaround (1774 x 887), each view's centre column
turn = Image.open(a.pack).convert("RGB")
packs = [cell(turn.crop((x0, 0, x1, 887)), cx - x0, 190, 647) for (x0, x1, cx) in [(20, 390, 205), (350, 730, 548), (700, 1060, 860), (1030, 1400, 1205), (1380, 1774, 1560)]]
# the engine: project the sole (y 0) and the cap top (y H) of the figure at the origin through the bench camera
def row(y, W=1080, Hh=1920, fov=30):
    P, L = (0, 1.0, 6.2), (0, 0.92, 0); f = [L[i] - P[i] for i in range(3)]; n = math.sqrt(sum(v * v for v in f)); f = [v / n for v in f]
    u = [0, 1, 0]; d = sum(u[i] * f[i] for i in range(3)); u = [u[i] - d * f[i] for i in range(3)]; n = math.sqrt(sum(v * v for v in u)); u = [v / n for v in u]
    v = [0 - P[0], y - P[1], 0 - P[2]]; z = sum(v[i] * f[i] for i in range(3)); yy = sum(v[i] * u[i] for i in range(3))
    return Hh / 2 - (yy / z) / math.tan(math.radians(fov / 2)) * Hh / 2
def eng(d, H):
    out = []
    for t in (0.2, 1.2, 2.2, 3.2, 4.2):
        im = Image.open(f"{d}/pebble-turnaround-anime-pro-t{t:.2f}.png").convert("RGB"); out.append(cell(im, im.width / 2, row(H), row(0)))
    return out
rows = [("YOUR PACK", packs), ("REJECTED (6 Nov, 9f10528)", eng(a.rejected, a.H)), ("NOW", eng(a.current, a.H2))]
LW = 40; sheet = Image.new("RGB", (LW + CW * 5, CH * 3), (255, 255, 255)); d = ImageDraw.Draw(sheet)
try: F = ImageFont.truetype("assets/fonts/Inter-ExtraBold.otf", 22)
except Exception: F = None
for r, (lab, cs) in enumerate(rows):
    for i, c in enumerate(cs): sheet.paste(c, (LW + i * CW, r * CH))
    g = r * CH + TOP + PX; d.line((LW, g, LW + CW * 5, g), fill=(200, 120, 90), width=1)   # the common ground line
    txt = Image.new("RGBA", (CH, LW), (0, 0, 0, 0)); ImageDraw.Draw(txt).text((CH // 2, LW // 2), lab, font=F, fill=(90, 55, 30), anchor="mm"); sheet.paste(txt.rotate(90, expand=True), (0, r * CH), txt.rotate(90, expand=True))
for i, n in enumerate(["front", "three-quarter", "left profile", "back", "right profile"]): d.text((LW + i * CW + CW // 2, 12), n, font=F, fill=(90, 55, 30), anchor="mt")
sheet.save(a.out); print(a.out, sheet.size)
