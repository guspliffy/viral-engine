"""Pebble fidelity sheet (Garden Guardian pack, Jonny 6 Nov 2026): the pack's turnaround next to the engine's views,
then the primary three-quarter reference and its face inset next to the engine's three-quarter, and Pebble beside a
standard potato.
  node engine/render.mjs storyboards/pebble/pebble-turnaround.json --stills 0.2,1.2,2.2,3.2,4.2,5.2,6.2
  python3 tools/pebble/compare.py [--pack <dir>] [--out out/pebble-compare.png] [--tag anime-pro]"""
import argparse, os
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("--pack", default="/mnt/project-files/characters/pebble/garden-guardian")
ap.add_argument("--out", default="out/pebble-compare.png")
ap.add_argument("--tag", default="anime-pro")
a = ap.parse_args()
turn = Image.open(f"{a.pack}/01-turnaround.png").convert("RGB")
prim = Image.open(f"{a.pack}/00-primary-reference.png").convert("RGB")
eng = lambda t: Image.open(f"out/pebble-turnaround-{a.tag}-t{t:.2f}.png").convert("RGB")
CW, CH = 300, 420
BG = (250, 244, 232)

def fit(im, box=None, cw=CW, ch=CH):
    if box: im = im.crop(box)
    im = im.copy(); im.thumbnail((cw, ch))
    c = Image.new("RGB", (cw, ch), BG); c.paste(im, ((cw - im.width) // 2, (ch - im.height) // 2)); return c

# the turnaround's five views (front, three-quarter, left profile, back, right profile)
TW, TH = turn.size
xs = [(30, 380), (360, 720), (720, 1050), (1040, 1390), (1390, 1745)]
views = [fit(turn, (int(x0 * TW / 1774), int(110 * TH / 887), int(x1 * TW / 1774), int(660 * TH / 887))) for x0, x1 in xs]
def body(t):
    im = eng(t); w, h = im.size; return fit(im, (int(w * 0.08), int(h * 0.08), int(w * 0.92), int(h * 0.8)))
row2 = [body(t) for t in (0.2, 1.2, 2.2, 3.2, 4.2)]
PW, PH = prim.size
big = lambda im: fit(im, None, CW * 5 // 4, CH * 5 // 4)
row3 = [big(prim.crop((60, 100, 860, 1230))), big(body(1.2)), big(prim.crop((700, 20, 1110, 560))), big(eng(5.2).crop((60, 450, 1080, 1700)))]
duo = fit(eng(6.2), (0, int(eng(6.2).size[1] * 0.25), eng(6.2).size[0], int(eng(6.2).size[1] * 0.88)))
W3 = CW * 5 // 4
sheet = Image.new("RGB", (60 + max(CW * 5, W3 * 4 + CW), CH * 2 + CH * 5 // 4 + 40), (255, 255, 255))
d = ImageDraw.Draw(sheet)
for r, (label, row) in enumerate([("PACK", views), ("ENGINE", row2)]):
    for i, im in enumerate(row): sheet.paste(im, (60 + i * CW, 10 + r * CH))
    d.text((4, 20 + r * CH), label, fill=(80, 50, 30))
for i, im in enumerate(row3 + [duo]): sheet.paste(im, (60 + i * W3, 20 + 2 * CH))
d.text((4, 30 + 2 * CH), "PRIMARY\n| ENGINE\nFACE\n| ENGINE\nF", fill=(80, 50, 30))
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
sheet.save(a.out); print(a.out)
