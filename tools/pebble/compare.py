"""Pebble fidelity sheet (Jonny's correction spec, 6 Nov 2026): his approved Option B sheet next to the engine stills,
view by view, so a drift shows at a glance.
  node engine/render.mjs storyboards/pebble/pebble-turnaround.json --stills 0.2,1.2,2.2,3.2,4.2,5.2,6.2
  python3 tools/pebble/compare.py [--ref <sheet.png>] [--out out/pebble-compare.png] [--tag anime-pro]
Top row: sheet front, three-quarter, side, back; under it the engine's. Bottom row: the sheet's expressions strip,
the engine's face close-ups and Pebble beside a standard potato (test F)."""
import argparse, os
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("--ref", default="/mnt/project-files/characters/pebble/pebble-reference-v1.png")
ap.add_argument("--out", default="out/pebble-compare.png")
ap.add_argument("--tag", default="anime-pro")
a = ap.parse_args()
ref = Image.open(a.ref).convert("RGB")
W, H = ref.size
eng = lambda t: Image.open(f"out/pebble-turnaround-{a.tag}-t{t:.2f}.png").convert("RGB")
CW, CH = 330, 440

def fit(im, box=None):
    if box: im = im.crop(box)
    im = im.copy(); im.thumbnail((CW, CH))
    c = Image.new("RGB", (CW, CH), (250, 244, 232)); c.paste(im, ((CW - im.width) // 2, (CH - im.height) // 2)); return c

# the sheet's four views: x quarters of the top 47 %
views = [fit(ref, (int(W * i / 4), int(H * 0.04), int(W * (i + 1) / 4), int(H * 0.47))) for i in range(4)]
# engine full shots: the middle of the frame (Pebble is centred)
def body(t):
    im = eng(t); w, h = im.size; return fit(im, (int(w * 0.05), int(h * 0.22), int(w * 0.95), int(h * 0.8)))
row2 = [body(t) for t in (0.2, 1.2, 2.2, 3.2)]
faces_ref = fit(ref, (0, int(H * 0.47), int(W * 0.5), int(H * 0.68)))
def face(t):
    im = eng(t); w, h = im.size; return fit(im, (0, int(h * 0.15), w, int(h * 0.85)))
duo = fit(eng(6.2), (0, int(eng(6.2).size[1] * 0.25), eng(6.2).size[0], int(eng(6.2).size[1] * 0.88)))
row3 = [faces_ref, face(4.2), face(5.2), duo]
sheet = Image.new("RGB", (CW * 4 + 50, CH * 3 + 30), (255, 255, 255))
d = ImageDraw.Draw(sheet)
for r, (label, row) in enumerate([("SHEET", views), ("ENGINE", row2), ("FACE / F", row3)]):
    for i, im in enumerate(row): sheet.paste(im, (50 + i * CW, 10 + r * CH))
    d.text((4, 20 + r * CH), label, fill=(80, 50, 30))
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
sheet.save(a.out); print(a.out)
