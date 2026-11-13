# Block B map card (panel 15, "800 km up the Nile"): a hand-drawn papyrus map of Egypt's Nile from the delta to Aswan, with
# Giza, Aswan and the red route. Deterministic (seeded hash marks). Real coordinates (lat, lon) projected flat.
#   python3 storyboards/series/ancient-aliens/01-pyramids/block-b/bench/make-nile-map.py  -> ../nile-map.png (1080 x 1920)
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
K = 2                                   # drawn at 2x, then halved: smooth hand lines
W, H = 1080 * K, 1920 * K
LAT0, LAT1, LON0, LON1 = 31.9, 23.4, 29.0, 34.6
def P(lat, lon):
    x = (lon - LON0) / (LON1 - LON0) * W
    y = (LAT0 - lat) / (LAT0 - LAT1) * H
    return (x, y)
def h(i, s=1.0):                        # hash 0..1
    v = math.sin(i * 127.1 + s * 311.7) * 43758.5453
    return v - math.floor(v)
img = Image.new("RGB", (W, H), "#e8d6ac")
d = ImageDraw.Draw(img)
# papyrus fibres: long faint strokes, each its own place
for i in range(900):
    y = h(i, 1) * H; x = h(i, 2) * W; L = 200 + h(i, 3) * 900
    c = (200 + int(h(i, 4) * 25), 180 + int(h(i, 5) * 25), 130 + int(h(i, 6) * 25))
    d.line([(x, y), (x + L, y + (h(i, 7) - 0.5) * 30)], fill=c, width=K)
# seas
med = [P(31.9, 29.0), P(31.9, 34.6), P(31.25, 34.6), P(31.2, 33.5), P(31.1, 32.6), P(31.5, 31.9), P(31.6, 31.3), P(31.45, 30.4), P(31.0, 29.6), P(30.9, 29.0)]
d.polygon(med, fill="#7fb0c8")
red = [P(29.95, 32.55), P(29.4, 32.65), P(28.8, 32.85), P(28.0, 33.3), P(27.2, 33.85), P(26.3, 34.15), P(25.2, 34.65), P(24.0, 35.4), P(23.4, 35.8), P(23.4, 34.6 + 1), P(31.9, 36)]
d.polygon([P(29.95, 32.55), P(29.4, 32.65), P(28.8, 32.85), P(28.0, 33.3), P(27.2, 33.85), P(26.3, 34.15), P(25.2, 34.65), P(24.4, 34.6 + 0.6), P(23.4, 35.8), P(23.4, 34.6), P(30.4, 34.6), P(30.0, 32.6)], fill="#7fb0c8")
# the Nile (lat, lon), delta to Aswan
nile = [(30.05, 31.23), (29.75, 31.22), (29.4, 31.18), (29.05, 31.1), (28.7, 30.92), (28.3, 30.8), (27.9, 30.82), (27.55, 30.95), (27.2, 31.2), (26.85, 31.45), (26.55, 31.72), (26.35, 32.0), (26.15, 32.4), (26.12, 32.7), (25.95, 32.78), (25.7, 32.65), (25.45, 32.55), (25.25, 32.55), (25.0, 32.6), (24.7, 32.85), (24.45, 32.92), (24.09, 32.89), (23.6, 32.9), (23.4, 32.85)]
delta = [[(30.05, 31.23), (30.4, 31.0), (30.8, 30.75), (31.2, 30.5), (31.45, 30.37)], [(30.05, 31.23), (30.45, 31.4), (30.85, 31.55), (31.2, 31.7), (31.5, 31.85)]]
# green fertile strip: wide soft strokes under the river
for line, wd in [(nile, 46), *[(b, 40) for b in delta]]:
    pts = [P(*q) for q in line]
    d.line(pts, fill="#8fae5c", width=wd * K, joint="curve")
d.polygon([P(30.05, 31.23), P(31.45, 30.3), P(31.55, 31.95)], fill="#8fae5c")
for line in [nile, *delta]:
    pts = [P(*q) for q in line]
    d.line(pts, fill="#2f6f98", width=9 * K, joint="curve")
# hand hatching on the desert: short strokes, each its own place
for i in range(1400):
    x, y = h(i, 11) * W, h(i, 12) * H
    if img.getpixel((int(x), int(y)))[2] > 160: continue          # not on water
    a = 0.6 + h(i, 13) * 0.3; L = 14 + h(i, 14) * 22
    d.line([(x, y), (x + L * math.cos(a), y + L * math.sin(a))], fill="#c9b07a", width=K)
# the route: red dashes along the river from Aswan to Giza
route = [P(*q) for q in reversed(nile[:22])]
seg = []
for a, b in zip(route, route[1:]):
    n = max(1, int(math.dist(a, b) / (6 * K)))
    seg += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n)]
for i in range(0, len(seg) - 4, 9):
    d.line([(seg[i][0] + 22 * K, seg[i][1]), (seg[i + 4][0] + 22 * K, seg[i + 4][1])], fill="#b3261e", width=11 * K)
# places
def dot(lat, lon, r=16):
    x, y = P(lat, lon); d.ellipse([x - r * K, y - r * K, x + r * K, y + r * K], fill="#2b2118", outline="#f3ead2", width=4 * K)
gx, gy = P(29.98, 31.13)
d.polygon([(gx - 120 * K, gy + 10 * K), (gx - 30 * K, gy + 10 * K), (gx - 75 * K, gy - 70 * K)], fill="#d8bd7a", outline="#6b5330", width=4 * K)
d.polygon([(gx - 75 * K, gy - 70 * K), (gx - 30 * K, gy + 10 * K), (gx - 62 * K, gy + 10 * K)], fill="#b99a5a")
dot(29.98, 31.13)
ax, ay = P(24.09, 32.89)
d.rectangle([ax + 40 * K, ay - 30 * K, ax + 150 * K, ay + 18 * K], fill="#a8554d", outline="#5a2622", width=4 * K)
for i in range(40):
    px, py = ax + 40 * K + h(i, 21) * 110 * K, ay - 30 * K + h(i, 22) * 48 * K
    d.ellipse([px - 3 * K, py - 3 * K, px + 3 * K, py + 3 * K], fill="#7d3b38" if i % 2 else "#d08f84")
dot(24.09, 32.89)
F = ImageFont.truetype("assets/fonts/Inter-Black.otf", 74 * K)
F2 = ImageFont.truetype("assets/fonts/Inter-Black.otf", 88 * K)
def label(x, y, s, f, fill="#2b2118"):
    d.text((x, y), s, font=f, fill=fill, stroke_width=6 * K, stroke_fill="#f3ead2", anchor="mm")
label(gx - 60 * K, gy + 75 * K, "GIZA", F)
label(ax - 30 * K, ay + 80 * K, "ASWAN", F)
mx, my = P(28.25, 31.85)
label(mx, my, "800 km", F2, "#b3261e")
# a faint vignette, like an old sheet
v = Image.new("L", (W, H), 0); vd = ImageDraw.Draw(v)
vd.rectangle([60 * K, 60 * K, W - 60 * K, H - 60 * K], fill=255)
v = v.filter(ImageFilter.GaussianBlur(90 * K))
img = Image.composite(img, Image.new("RGB", (W, H), "#a98d5c"), v)
img = img.resize((1080, 1920), Image.LANCZOS)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "nile-map.png")
img.save(out, optimize=True); print(os.path.normpath(out))
