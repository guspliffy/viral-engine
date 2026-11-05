#!/usr/bin/env python3
"""Tile engine stills (and optionally a reference image) into one board, cropped to the character.

  python3 tools/friends/board.py out.png --crop 0.18,0.3,0.82,0.95 --labels front,3q... a.png b.png ...
  --ref references/friends-v1/images/01-rusty-reference.png puts the reference sheet on top, scaled to the row width.
  --h 520 sets each tile's height.
"""
import argparse
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("imgs", nargs="+")
ap.add_argument("--crop", default="0,0,1,1"); ap.add_argument("--labels", default="")
ap.add_argument("--ref", default=None); ap.add_argument("--h", type=int, default=520); ap.add_argument("--cols", type=int, default=0)
a = ap.parse_args()
x0, y0, x1, y1 = map(float, a.crop.split(","))
labels = a.labels.split(",") if a.labels else []
tiles = []
for i, p in enumerate(a.imgs):
    im = Image.open(p).convert("RGB"); W, H = im.size
    im = im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)))
    im = im.resize((int(im.width * a.h / im.height), a.h), Image.LANCZOS)
    if i < len(labels):
        d = ImageDraw.Draw(im); d.rectangle((0, 0, im.width, 26), fill=(30, 26, 24)); d.text((8, 6), labels[i], fill=(255, 240, 220))
    tiles.append(im)
cols = a.cols or len(tiles); rows = (len(tiles) + cols - 1) // cols
tw = max(t.width for t in tiles); Wt = tw * cols
ref = None
if a.ref:
    ref = Image.open(a.ref).convert("RGB"); ref = ref.resize((Wt, int(ref.height * Wt / ref.width)), Image.LANCZOS)
Ht = rows * a.h + (ref.height if ref else 0)
board = Image.new("RGB", (Wt, Ht), (245, 240, 232))
yo = 0
if ref: board.paste(ref, (0, 0)); yo = ref.height
for i, t in enumerate(tiles): board.paste(t, ((i % cols) * tw, yo + (i // cols) * a.h))
board.save(a.out); print("wrote", a.out, board.size)
