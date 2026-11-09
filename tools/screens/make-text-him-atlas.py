#!/usr/bin/env python3
"""Chat-screen atlas for "Never Looks Up" S2 E1 "Text him": the Wizard's messenger, dark mode, a chat with Phoenix.
3 tiles in one row, each 1080x1920:  0 empty chat, "Message" placeholder | 1 "look up" typed, send arrow lit |
2 sent: a big blue bubble "look up", "Delivered", empty input.
Deterministic (PIL, no randomness).   python3 tools/screens/make-text-him-atlas.py
Use: style "iphone", screen { src: "assets/screens/text-him/atlas.png", cols: 3, rows: 1 }, feed 0 / 1 / 2."""
import math, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT = os.path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf")
OUT = os.path.join(ROOT, "assets/screens/text-him/atlas.png")
W, H, SS = 1080, 1920, 2   # tile size, supersampling
BG, BAR, FIELD = (14, 15, 20), (24, 26, 33), (38, 40, 49)
BLUE, GREY, WHITE, ORANGE = (47, 124, 246), (130, 134, 146), (255, 255, 255), (255, 138, 31)

def font(px): return ImageFont.truetype(FONT, int(px * SS))

def tile(i):
    im = Image.new("RGB", (W * SS, H * SS), BG); d = ImageDraw.Draw(im)
    s = lambda v: int(v * SS)
    def rr(box, r, fill): d.rounded_rectangle([s(box[0]), s(box[1]), s(box[2]), s(box[3])], s(r), fill=fill)
    def text(xy, t, px, fill, anchor="la"): d.text((s(xy[0]), s(xy[1])), t, font=font(px), fill=fill, anchor=anchor)
    # header: back chevron, avatar with a flame, name, "online"
    d.rectangle([0, 0, W * SS, s(190)], fill=BAR)
    d.line([s(86), s(70), s(52), s(104), s(86), s(138)], fill=BLUE, width=s(11), joint="curve")
    cx, cy = 190, 104
    d.ellipse([s(cx - 56), s(cy - 56), s(cx + 56), s(cy + 56)], fill=ORANGE)
    flame = [(cx, cy - 36), (cx + 14, cy - 14), (cx + 28, cy + 6), (cx + 20, cy + 30), (cx, cy + 38), (cx - 20, cy + 30), (cx - 28, cy + 6), (cx - 14, cy - 12), (cx - 8, cy + 2), (cx - 2, cy - 18)]
    d.polygon([(s(x), s(y)) for x, y in flame], fill=(255, 240, 190))
    d.polygon([(s(cx + (x - cx) * 0.5), s(cy + 10 + (y - cy) * 0.5)) for x, y in flame], fill=(255, 150, 40))
    text((272, 70), "Phoenix", 56, WHITE, "lm"); text((272, 128), "online", 36, (96, 214, 130), "lm")
    d.rectangle([0, s(190), W * SS, s(193)], fill=(10, 10, 14))
    # input row: a plus, the field, a send button
    fy0, fy1 = 1668, 1840
    d.ellipse([s(40), s(fy0 + 26), s(40 + 120), s(fy0 + 26 + 120)], fill=FIELD)
    d.line([s(100), s(fy0 + 62), s(100), s(fy0 + 110)], fill=GREY, width=s(9)); d.line([s(76), s(fy0 + 86), s(124), s(fy0 + 86)], fill=GREY, width=s(9))
    rr((184, fy0, 920, fy1), 86, FIELD)
    lit = i == 1
    sx, sy = 1000, (fy0 + fy1) / 2
    d.ellipse([s(sx - 60), s(sy - 60), s(sx + 60), s(sy + 60)], fill=BLUE if lit else FIELD)
    ar = WHITE if lit else (90, 93, 104)
    d.line([s(sx), s(sy + 26), s(sx), s(sy - 26)], fill=ar, width=s(10))
    d.line([s(sx - 24), s(sy - 4), s(sx), s(sy - 30), s(sx + 24), s(sy - 4)], fill=ar, width=s(10), joint="curve")
    if i == 1:
        text((236, sy), "look up", 112, WHITE, "lm")
        tw = d.textlength("look up", font=font(112)) / SS
        rr((236 + tw + 14, sy - 52, 236 + tw + 24, sy + 52), 5, BLUE)   # the cursor bar
    else:
        text((236, sy), "Message", 62, GREY, "lm")
    if i == 2:
        text((W / 2, 262), "Today 9:41", 34, GREY, "mm")
        f = font(150); tw = d.textlength("look up", font=f) / SS
        bw, bh = tw + 130, 250
        x1, y0 = 1020, 420; x0 = x1 - bw
        rr((x0, y0, x1, y0 + bh), 90, BLUE)
        d.polygon([(s(x1 - 70), s(y0 + bh - 40)), (s(x1 + 24), s(y0 + bh + 10)), (s(x1 - 20), s(y0 + bh - 90)), (s(x1 - 20), s(y0 + bh - 40))], fill=BLUE)   # the tail
        text(((x0 + x1) / 2, y0 + bh / 2 + 4), "look up", 150, WHITE, "mm")
        text((x1 - 10, y0 + bh + 40), "Delivered", 38, GREY, "ra")
    return im.resize((W, H), Image.LANCZOS)

atlas = Image.new("RGB", (W * 3, H))
for i in range(3): atlas.paste(tile(i), (i * W, 0))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
atlas.save(OUT, optimize=True)
print(OUT, atlas.size)
