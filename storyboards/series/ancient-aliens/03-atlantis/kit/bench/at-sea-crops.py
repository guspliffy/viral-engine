#!/usr/bin/env python3
# Crops of plate 05 (the painted Gibraltar rock) that engine/page/props-at-sea.js lays on its 3D pieces (round R, brief R3).
#   python3 storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-sea-crops.py [plate.png]
# Writes assets/props/atlantis/sea-*.webp:
#   sea-gibraltar-sky.webp  2048 x 278 RGBA  the painted sky, sun, cloud, the Rock and Africa down to the horizon line, widened by mirroring (edges faded)
#   sea-rock-plan.webp      1280 x 832 RGBA  the painted rock top rectified to a plan (x -1.6..1.6, z -0.8..1.28); alpha 1 rock, 0.6 the wet sheen, 0 no paint
#   sea-rock-tile.webp      512 x 512 RGB    seamless plain painted rock (0.9 m), the barnacles painted out: the flanks and what the plan does not cover
#   sea-splash.webp         400 x 296 RGBA   the painted surf jet with its drops (1.55 x 1.15 m)
# The plate's camera (measured on the plate): 1536 x 1024, focal 1187 px, pitched 11.15 deg down (horizon at y 278), 1.15 m above the rock top.
import sys, math, os
import numpy as np, cv2
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/plate-05-gibraltar-rock-today.png"
OUT = os.path.join(ROOT, "assets/props/atlantis")
os.makedirs(OUT, exist_ok=True)
im = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32) / 255.0
H, W = im.shape[:2]
ss = lambda a, b, x: (lambda t: t * t * (3 - 2 * t))(np.clip((x - a) / (b - a), 0, 1))
def save(name, arr, q=90):
    Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, name), "WEBP", quality=q, method=6, exact=True)
    print(name, arr.shape)
def poly(pts, feather=0, shape=(H, W)):
    m = np.zeros(shape, np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255); m = m.astype(np.float32) / 255
    return cv2.GaussianBlur(m, (0, 0), feather) if feather else m

# ---- 1. the sky strip
HOR = 278
EXL, EXR, SUNX = 380, 132, 200                              # wider than the plate: the sky mirrored about the sun on the left (no land there), about the edge on the right
sky = np.concatenate([im[:HOR, 2 * SUNX + EXL:2 * SUNX:-1], im[:HOR], im[:HOR, W - 1:W - 1 - EXR:-1]], axis=1); SW = sky.shape[1]
xs = np.arange(SW)[None, :] / (SW - 1); ys = np.arange(HOR)[:, None] / (HOR - 1)
a = ss(0.0, 0.06, xs) * ss(0.0, 0.05, 1 - xs) * ss(0.0, 0.3, ys)
save("sea-gibraltar-sky.webp", np.dstack([sky, np.broadcast_to(a, sky.shape[:2])]), 92)

# ---- 2. the rock plan
ROCK = [(0, 1024), (0, 792), (28, 760), (95, 714), (112, 692), (160, 674), (215, 664), (300, 657), (372, 657), (398, 674), (470, 674), (520, 666), (600, 662), (650, 657), (720, 658),
        (790, 670), (803, 692), (880, 694), (935, 705), (962, 730), (1010, 742), (1040, 757), (1062, 790), (1085, 815), (1120, 836), (1158, 862), (1150, 900), (1185, 935), (1140, 960), (1120, 1000), (1150, 1024)]
rock = cv2.erode(poly(ROCK), np.ones((5, 5), np.uint8)); rock = cv2.GaussianBlur(rock, (0, 0), 4)
lum = im @ np.array([0.3, 0.59, 0.11], np.float32)
box = poly([(318, 712), (420, 694), (560, 688), (720, 692), (800, 700), (862, 735), (862, 800), (845, 850), (700, 852), (560, 800), (470, 806), (440, 770), (340, 752)], 6)
sheen = ((lum > 0.36) | (im[..., 2] > im[..., 0] * 1.12) & (lum > 0.25)).astype(np.float32) * (box > 0.5)
sheen = cv2.morphologyEx(sheen, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)); sheen = cv2.morphologyEx(sheen, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); sheen = cv2.GaussianBlur(sheen, (0, 0), 3)
F, PITCH, CAMH = 1187.0, math.radians(11.15), 1.15
PW, PH, X0, X1, Z0, Z1 = 1280, 832, -1.6, 1.6, -0.8, 1.28
gx, gz = np.meshgrid(X0 + (np.arange(PW) + 0.5) / PW * (X1 - X0), Z0 + (np.arange(PH) + 0.5) / PH * (Z1 - Z0))
X = gx - 0.53; D = 2.73 - (gz - 0.15)                       # plan metres -> metres right of / in front of the plate's camera
zc = D * math.cos(PITCH) + CAMH * math.sin(PITCH); yc = -D * math.sin(PITCH) + CAMH * math.cos(PITCH)
mx = (W / 2 + F * X / zc).astype(np.float32); my = (H / 2 + F * yc / zc).astype(np.float32)
rm = lambda src: cv2.remap(src, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
prgb = np.clip(rm(im), 0, 1); pa = np.clip(rm(rock), 0, 1); psh = np.clip(rm(sheen), 0, 1)
inside = ((mx > 4) & (mx < W - 5) & (my > 4) & (my < H - 5)).astype(np.float32); pa *= cv2.GaussianBlur(cv2.erode(inside, np.ones((25, 25), np.uint8)), (0, 0), 8)
fill = cv2.inpaint((prgb * 255).astype(np.uint8), (pa < 0.5).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA).astype(np.float32) / 255   # no sea colour bleeding in at the edge
prgb = prgb * pa[..., None] + fill * (1 - pa[..., None])
save("sea-rock-plan.webp", np.dstack([prgb, pa * (1 - 0.4 * psh)]), 90)

# ---- 3. the plain rock tile
t = im[815:1023, 275:483].copy(); tl = lum[815:1023, 275:483]          # the plainest window of the painted rock (0.45 m), drawn twice as large
bl = cv2.GaussianBlur(tl, (0, 0), 7)
k = cv2.GaussianBlur(cv2.dilate(((tl > bl + 0.12) | (tl > 0.44)).astype(np.float32), np.ones((5, 5), np.uint8)), (0, 0), 2)[..., None]
med = cv2.medianBlur((t * 255).astype(np.uint8), 21).astype(np.float32) / 255
t8 = ((t * (1 - k) + med * 0.9 * k) * 255).astype(np.uint8)
t8 = cv2.resize(t8, (640, 640), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
N, B = 512, 128                                              # cross-fade the wrap: the last B columns / rows melt into the first
def wrap(a, axis):
    a = np.moveaxis(a, axis, 0); k = ss(0, 1, np.arange(B) / (B - 1)).reshape(-1, 1, 1)
    out = a[:N].copy(); out[:B] = a[:B] * k + a[N:N + B] * (1 - k); return np.moveaxis(out, 0, axis)
t8 = wrap(wrap(t8, 0), 1)
m = t8.mean(axis=(0, 1), keepdims=True); low = cv2.GaussianBlur(np.pad(t8, ((N, N), (N, N), (0, 0)), mode="wrap"), (0, 0), 60)[N:2 * N, N:2 * N]; t8 = t8 - (low - m) * 0.8   # even out the big light / dark blotches so the repeat does not read
save("sea-rock-tile.webp", t8, 90)

# ---- 4. the surf jet
x0, y0, x1, y1 = 1100, 610, 1500, 906
s = im[y0:y1, x0:x1].copy()
env = poly([(1100, 906), (1104, 760), (1150, 700), (1178, 628), (1300, 612), (1345, 640), (1400, 760), (1500, 800), (1500, 906)], 9)[y0:y1, x0:x1] * (1 - rock[y0:y1, x0:x1])
white = ss(0.50, 0.74, s[..., 0]) * ss(0.5, 0.7, s.min(axis=2) / np.maximum(s.max(axis=2), 1e-3))
yy = np.arange(y1 - y0)[:, None] / (y1 - y0 - 1); xx = np.arange(x1 - x0)[None, :] / (x1 - x0 - 1)
a = white * env * ss(0, 0.1, 1 - yy) * ss(0, 0.05, xx) * ss(0, 0.05, 1 - xx)
s = np.maximum(s, 0.72 + 0.2 * s)                           # the see-through fringe stays foam-pale, never teal
save("sea-splash.webp", np.dstack([s, a]), 92)
