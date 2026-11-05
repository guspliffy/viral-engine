"""Tile the eye sheet stills (storyboards/lookdev/make-eye-sheet.mjs) into one picture per view: today's eyes on top,
"rig": { "eyes": 2 } below, 9 looks across and 4 lid closures down in each, cropped round the eyes.
  python3 tools/eye-sheet/tile.py <stills dir> <name> <out dir> [--crop x0,y0,x1,y1]
"""
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

LOOKS = ["up-left", "up", "up-right", "left", "ahead", "right", "down-left", "down", "down-right"]
LIDS = [0, 0.3, 0.55, 0.75]
HOLD = 0.25


def font(size):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"]:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def main():
    src, name, out = sys.argv[1], sys.argv[2], sys.argv[3]
    crop = (0, 560, 1080, 1360)
    if "--crop" in sys.argv:
        crop = tuple(int(v) for v in sys.argv[sys.argv.index("--crop") + 1].split(","))
    cw, ch = 300, round(300 * (crop[3] - crop[1]) / (crop[2] - crop[0]))
    pad, lab = 6, 34
    F, Fs = font(30), font(22)
    os.makedirs(out, exist_ok=True)
    for view in ["front", "three", "profile"]:
        W = 110 + 9 * (cw + pad)
        H = 2 * (lab + 30 + 4 * (ch + pad)) + 20
        sheet = Image.new("RGB", (W, H), "#1d1b22")
        g = ImageDraw.Draw(sheet)
        y = 0
        for v, title in [("v1", "TODAY"), ("v2", 'NEW  "rig": { "eyes": 2 }')]:
            g.text((10, y + 4), f"{title}   {name}, {view}", fill="#ffffff", font=F)
            y += lab
            for i, l in enumerate(LOOKS):
                g.text((110 + i * (cw + pad) + 8, y + 2), l, fill="#cfc8e0", font=Fs)
            y += 30
            for j, lid in enumerate(LIDS):
                g.text((10, y + j * (ch + pad) + ch // 2 - 12), f"lid {lid}", fill="#cfc8e0", font=Fs)
                for i in range(9):
                    t = (j * 9 + i) * HOLD + 0.2
                    f = glob.glob(os.path.join(src, f"eye-sheet-{name}-{view}-{v}-*-t{t:.2f}.png"))
                    if not f:
                        continue
                    im = Image.open(f[0]).convert("RGB").crop(crop).resize((cw, ch), Image.LANCZOS)
                    sheet.paste(im, (110 + i * (cw + pad), y + j * (ch + pad)))
            y += 4 * (ch + pad) + 20
        p = os.path.join(out, f"eye-sheet-{name}-{view}.png")
        sheet.save(p)
        print(p)


main()
