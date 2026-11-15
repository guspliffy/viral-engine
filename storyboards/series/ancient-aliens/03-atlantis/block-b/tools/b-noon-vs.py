#!/usr/bin/env python3
"""Block B3 bench sheets: the painting (rows 40..904 of the plate) beside the bench still, 960 x 540 each -> block-b/bench/b-noon-<name>-vs.png, and the contact sheet b-noon-sheet.png.
  python3 .../b-noon-vs.py out/b-noon           (stills named b-noon[-bare]-anime-pro-draft-t<time>.png, the times from bench/b-noon[-bare]-names.json)"""
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "../../../../../.."))
BENCH = os.path.join(HERE, "../bench"); PL = "/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/"
PLATE = {"W": "plate-17-citadel-wall-noon.png", "B": "plate-19-bridge-noon.png"}
W, H = 960, 540
out = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else "out/b-noon"); tiles = []
for bid in ("b-noon-bare", "b-noon"):
    nj = os.path.join(BENCH, bid + "-names.json")
    if not os.path.exists(nj): continue
    d = json.load(open(nj))
    for n, t, lab in zip(d["names"], d["times"], d["labels"]):
        f = os.path.join(out, f"{bid}-anime-pro-draft-t{t}.png")
        if not os.path.exists(f): continue
        still = Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS); tiles.append((n, lab, still))
        if n in ("W1", "W4", "B1", "B4", "W2", "B2"):
            p = Image.open(PL + PLATE[n[0]]).convert("RGB").crop((0, 40, 1536, 904)).resize((W, H), Image.LANCZOS)
            s = Image.new("RGB", (W * 2, H)); s.paste(p, (0, 0)); s.paste(still, (W, 0)); s.save(os.path.join(BENCH, f"b-noon-{n}-vs.png")); print("wrote", f"b-noon-{n}-vs.png")
if tiles:
    cols = 2; rows = (len(tiles) + 1) // 2; sh = Image.new("RGB", (W * cols, (H + 22) * rows), "black"); dr = ImageDraw.Draw(sh)
    for i, (n, lab, im) in enumerate(sorted(tiles, key=lambda t: t[0])):
        x, y = (i % cols) * W, (i // cols) * (H + 22); sh.paste(im, (x, y + 22)); dr.text((x + 6, y + 5), f"{n}  {lab}", fill=(255, 255, 255))
    sh.save(os.path.join(BENCH, "b-noon-sheet.png")); print("wrote b-noon-sheet.png")
