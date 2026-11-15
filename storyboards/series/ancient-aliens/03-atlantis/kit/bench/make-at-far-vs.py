# Side-by-side sheet for round R2: the painting left, the bench still right, same size (960 x 540 each).
#   node make-at-far.mjs A,Q,W,A8,Q2,W2,A3,Q3,D,E,F ; node engine/render.mjs <bench>/at-far-A-Q-W-A8-Q2-W2-A3-Q3-D-E-F.json --stills 0.65,...,10.65 --draft --out out/at-far ; python3 make-at-far-vs.py   (stills in shot order: A 0.65, Q 3.65, W 5.65)
# The paintings are 3:2, the film 16:9: the film frame is the plate's full width and 864 rows from `top` (0, 0, 100), as props-at-far.js PLATES.
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../../.."))
PLATES = "/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/"
OUT = os.path.join(ROOT, "out/at-far/")
ROWS = [("plate-03-aerial-rings-dawn.png", 0, "at-far-A-Q-W-A8-Q2-W2-A3-Q3-D-E-F-anime-pro-draft-t0.65.png"),
        ("plate-04-harbour-wall-past.png", 0, "at-far-A-Q-W-A8-Q2-W2-A3-Q3-D-E-F-anime-pro-draft-t3.65.png"),
        ("plate-11-walls-view-dawn.png", 100, "at-far-A-Q-W-A8-Q2-W2-A3-Q3-D-E-F-anime-pro-draft-t5.65.png")]
W, H = 960, 540
sheet = Image.new("RGB", (W * 2, H * len(ROWS)), "black")
for i, (plate, top, still) in enumerate(ROWS):
    p = Image.open(PLATES + plate).convert("RGB")
    ch = round(p.width * 9 / 16)
    sheet.paste(p.crop((0, top, p.width, top + ch)).resize((W, H), Image.LANCZOS), (0, i * H))
    sheet.paste(Image.open(OUT + still).convert("RGB").resize((W, H), Image.LANCZOS), (W, i * H))
sheet.save(os.path.join(HERE, "at-far-vs.png"))
print("wrote", os.path.join(HERE, "at-far-vs.png"))
