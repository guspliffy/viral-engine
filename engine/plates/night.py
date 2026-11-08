# Paints the night version of a day plate (engine/page/sky.js fades to it when the HUD clock reaches night): the same
# room, the same picture, so it can cross-fade on the plate's own relief (Jonny 8 Nov 2026: "when we go night time in
# the scene the outdoor time should change as well").
#   python engine/plates/night.py assets/plates/livingroom-golden.png        -> livingroom-golden.night.png
# The window panes (a JSON next to the picture, <name>.night.json: { "panes": [[[x, y] x4], ...], "moon": [x, y, r],
# "lit": [[x, y, w, h], ...] } in picture pixels) become a night view: a deep blue sky with stars and the moon, the
# trees and houses outside dark silhouettes, a few warm lit windows. The room becomes a lamp-lit room at night: the
# low sun's bright stripes and patches are pressed toward the wall's own colour and turned to a faint cool moonlight,
# shadows go blue, a third of the painting's colour stays. Deterministic; numpy + Pillow.
import sys, os, json, numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = sys.argv[1]
base = src[:-4]
spec = json.load(open(base + ".night.json"))
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
H, W = im.shape[:2]


def col(h): return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
def lum(a): return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
def blur(a, r): return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


# ---- the panes: a soft-edged mask of the glass
mask_img = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(mask_img)
for p in spec["panes"]: d.polygon([tuple(q) for q in p], fill=255)
pane = np.asarray(mask_img.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)[..., None] / 255

# ---- the room at night: lamp-lit, the sunlight gone
L = lum(im)
wallL = float(np.percentile(L[(pane[..., 0] < 0.01)], 70))    # the lit wall's own brightness
cap = wallL * 0.95                                             # brighter than the wall = the low sun's stripes and patches
k = np.where(L > cap, cap / np.maximum(L, 1e-3), 1.0) ** 0.85
room = im * k
sun = np.clip((L - cap) / 0.2, 0, 1)
sun = blur(np.repeat(sun, 3, -1), 2)[..., :1] * (1 - pane)
Lr = lum(room)
room = Lr + (room - Lr) * 0.7                                  # a little less colour at night
room = room * col(spec.get("night", "#9a96c0"))                # night: darker, the shadows bluer
room = room + sun * (col("#8fa3d8") * Lr * 0.9 - room) * 0.35  # a faint cool moonlight where the sun was
# a warm lamp off frame, low on the right (an evening room has its lamps on)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
lx, ly, lr = spec.get("lamp", [W * 1.05, H * 0.62, W * 0.95])
lamp = np.clip(1 - np.hypot(xx - lx, yy - ly) / lr, 0, 1)[..., None] ** 1.5
room = room * (1 + col("#ffb066") * 0.55 * lamp)
room = np.clip(room, 0, 1)

# ---- the view at night
vL = lum(im)
sat = (im.max(-1) - im.min(-1))[..., None]
sky = np.clip((vL - 0.7) * 6, 0, 1) * np.clip((0.32 - sat) * 6, 0, 1)   # bright, pale: the open sky
sky = blur(np.repeat(sky, 3, -1), 1.2)[..., :1]
rows = yy[..., None] / H
y0 = min(q[1] for p in spec["panes"] for q in p) / H; y1 = max(q[1] for p in spec["panes"] for q in p) / H
k = np.clip((rows - y0) / max(y1 - y0, 1e-3), 0, 1)
TOP, HOR = col("#0e1840"), col("#3a5294")
skyc = TOP + (HOR - TOP) * np.power(k, 1.3)
skyc = skyc + (vL - 0.85) * 0.25                               # the painted clouds keep a faint shape
sil = col("#070b1a") + (col("#25335c") - col("#070b1a")) * np.clip((vL - 0.35) * 1.8, 0, 1) + (im - vL) * 0.1
view = sky * skyc + (1 - sky) * sil
rng = np.random.default_rng(spec.get("seed", 7))               # stars in the open sky
for _ in range(int(spec.get("stars", 70))):
    x, y = rng.uniform(0, W), rng.uniform(H * y0, H * (y0 + (y1 - y0) * 0.55))
    xi, yi = int(x), int(y)
    if pane[yi, xi, 0] > 0.9 and sky[yi, xi, 0] > 0.6:
        b = rng.uniform(0.35, 0.9); r = 1 if b < 0.75 else 2
        view[max(0, yi - r + 1):yi + r, max(0, xi - r + 1):xi + r] = np.maximum(view[max(0, yi - r + 1):yi + r, max(0, xi - r + 1):xi + r], col("#dfe6ff") * b)
if spec.get("moon"):                                           # the moon with a soft halo
    mx, my, mr = spec["moon"]
    dm = np.hypot(xx - mx, yy - my)[..., None]
    halo = np.clip(1 - (dm - mr) / (mr * 4), 0, 1) ** 2 * 0.45
    view = view + col("#7f95d8") * halo * sky
    disc = np.clip((mr - dm) / 1.5, 0, 1)
    view = view * (1 - disc) + col("#f4f0dc") * disc
for x, y, w, h in spec.get("lit", []):                        # warm windows across the street
    win = np.zeros((H, W, 1), np.float32); win[int(y):int(y + h), int(x):int(x + w)] = 1
    glow = blur(np.repeat(win, 3, -1), 3)[..., :1]
    view = view + col("#ffc46b") * (win * 0.85 + glow * 0.5) * (1 - sky)
view = np.clip(view, 0, 1)

out = room * (1 - pane) + view * pane
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(base + ".night.png")
print("wrote", base + ".night.png", "wall", round(wallL, 3))
