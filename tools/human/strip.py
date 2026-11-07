# Combine the preview stills of one storyboard into a labelled strip:  python3 tools/human/strip.py <id> <out.png> [cols]
import glob, sys, re
from PIL import Image, ImageDraw
sid, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
fs = sorted(glob.glob(f"out/{sid}-anime-pro-t*.png"), key=lambda f: float(re.search(r"-t([0-9.]+)\.png$", f).group(1)))
w, h = 240, 427
W = Image.new("RGB", (w * cols, h * ((len(fs) + cols - 1) // cols)), "white")
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((w, h)); d = ImageDraw.Draw(im)
    d.text((4, 4), re.search(r"-t([0-9.]+)\.png$", f).group(1), fill="red")
    W.paste(im, ((i % cols) * w, (i // cols) * h))
W.save(out)
