#!/usr/bin/env python3
# side by side of stills (old | new), optionally a crop: ab.py out.png [--crop x,y,w,h] [--w 540] a.png b.png [c.png d.png ...]
import sys
from PIL import Image, ImageDraw
a = sys.argv[1:]; out = a.pop(0); crop = None; W = 540
while a and a[0].startswith('--'):
    k = a.pop(0); v = a.pop(0)
    if k == '--crop': crop = tuple(int(x) for x in v.split(','))
    if k == '--w': W = int(v)
ims = []
for f in a:
    im = Image.open(f).convert('RGB')
    if crop: x, y, w, h = crop; im = im.crop((x, y, x + w, y + h))
    ims.append(im.resize((W, round(im.height * W / im.width)), Image.LANCZOS))
H = max(i.height for i in ims)
S = Image.new('RGB', (W * len(ims) + 8 * (len(ims) - 1), H), 'white')
for i, im in enumerate(ims): S.paste(im, (i * (W + 8), 0))
S.save(out)
