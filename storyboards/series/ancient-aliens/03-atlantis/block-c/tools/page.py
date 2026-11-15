#!/usr/bin/env python3
"""Block C, panel 26: the 1940 page. Takes plate-26 (painted from Jonny's approved panel) and types into its blank band the
one line of the real 1940 reading that the story needs: "Expect it in '68 and '69; not so far away!" with gaps where the
engine's `pagemarks` (engine/page/props-at-towns.js) strikes "68" and "69" on screen and underlines them in red pencil;
"1940" is struck in the top right date corner the same way. Writes assets/plates/at-c-page-1940.png and prints the marks
(x = left edge, y = baseline, plate px) for the generator.
    python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/page.py [plate.png]"""
import sys, os, math, json
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/plate-26-page-1940.png"
OUT = os.path.join(ROOT, "assets/plates/at-c-page-1940.png")
FONT = "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"
SIZE, INK, TILT = 22, (58, 52, 44), -3.2          # px height, DESIGNS ink #3a342c, the painted lines' slope (deg)
PITCH = 0.6 * SIZE                                 # px per character, as pagemarks
hs = lambda i: (math.sin(i * 127.1 + 311.7) * 43758.5453) % 1.0
im = Image.open(SRC).convert("RGB")
layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
font = ImageFont.truetype(FONT, SIZE)
def typeline(x0, y0, text, skip=()):
    """strike `text` from (x0, y0 baseline) along the painted slope; characters at indices in skip are left blank"""
    for i, ch in enumerate(text):
        if ch == " " or i in skip: continue
        x = x0 + i * PITCH; y = y0 + i * PITCH * math.tan(math.radians(TILT))
        g = Image.new("RGBA", (40, 40), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
        a = int(255 * (0.62 + 0.3 * hs(i + 7)))                   # uneven ribbon
        d.text((8, 8), ch, font=font, fill=INK + (a,))
        g = g.rotate(-TILT + (hs(i) - 0.5) * 3, resample=Image.BICUBIC)
        layer.alpha_composite(g, (int(x - 8), int(y - SIZE - 8 + (hs(i + 3) - 0.5) * 2)))
LINE = "Expect it in '68 and '69; not so far away!"
X0, Y0 = 392, 548
typeline(X0, Y0, LINE, skip=(14, 15, 22, 23))
out = Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")
out.save(OUT, optimize=True)
at = lambda i: [round(X0 + i * PITCH), round(Y0 + i * PITCH * math.tan(math.radians(TILT)))]
print(json.dumps({"size": SIZE, "pitch": round(PITCH, 2), "marks": [{"text": "1940", "x": 968, "y": 100}, {"text": "68", **dict(zip("xy", at(14)))}, {"text": "69", **dict(zip("xy", at(22)))}]}))
print("wrote", OUT, out.size)
