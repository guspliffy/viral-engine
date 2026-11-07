# Relights the lakeside-campsite painting (assets/environments/lakeside-campsite/paint.png) for Too Much Energy 03 by a
# colour grade, so the place stays the same picture: "dawn" (deep blue sky, clouds lit pink from below, a peach band on
# the horizon, the meadow in cool shade) and "sun" (gold sky, the sun just over the hills right of centre, a glitter
# path on the lake, warm meadow). Deterministic; numpy + Pillow.
#   python engine/plates/grade-camp.py assets/environments/lakeside-campsite/paint.png assets/plates/camp-dawn.png dawn
#   python engine/plates/grade-camp.py assets/environments/lakeside-campsite/paint.png assets/plates/camp-sunrise.png sun
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
H, W, _ = im.shape
y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
L = (0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2])[..., None]
HOR = 0.285   # the lake's far shore / hills line
def lerp(a, b, k): return a + (b - a) * k
def col(h): return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
# the sky: blue or bright-grey (cloud) pixels above the far shore, feathered (trees and hills are green and darker)
sat = im.max(-1) - im.min(-1)
skym = np.clip((L[..., 0] - 0.5) * 7 + (im[..., 2] - im[..., 1]) * 6, 0, 1) * np.clip((0.315 - y[..., 0]) * 60, 0, 1)
skym = np.asarray(Image.fromarray((skym * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
def mix(a, b): return a * skym + b * (1 - skym)
def grade(kind):
    if kind == "dawn":
        top, mid, hor = col("#1b2556"), col("#3f4f8f"), col("#e9a38c")
        k = np.clip(y / HOR, 0, 1)
        g = np.where(k < 0.6, lerp(top, mid, k / 0.6), lerp(mid, hor, (k - 0.6) / 0.4))
        skyc = g * (0.55 + 0.75 * L) + col("#ffb6a8") * np.clip(L - 0.75, 0, 1) * 0.6   # clouds lit pink from below
        ground = im * col("#6f88b8") * 0.78 + col("#0c1630") * 0.12
        # the hills band just under the horizon: a little pink haze on the water
        haze = np.exp(-((y - HOR) / 0.05) ** 2) * col("#d98f8f") * 0.18
        o = mix(skyc, ground + haze)
    else:
        top, mid, hor = col("#5a6fb0"), col("#e7a06a"), col("#ffd07a")
        k = np.clip(y / HOR, 0, 1)
        g = np.where(k < 0.5, lerp(top, mid, k / 0.5), lerp(mid, hor, (k - 0.5) / 0.5))
        skyc = g * (0.6 + 0.7 * L)
        ground = im * col("#ffd9a0") * 0.95 + col("#40200a") * 0.03
        sx, sy = 0.62, HOR - 0.012
        d = np.sqrt(((x - sx) * W / H) ** 2 + (y - sy) ** 2)
        glow = np.exp(-(d / 0.06) ** 2) * 0.8 + np.exp(-(d / 0.18) ** 2) * 0.3
        disc = (d < 0.022).astype(np.float32)
        # the sun's path on the lake: a glitter column under it
        path = np.exp(-(((x - sx) * W / H) / 0.035) ** 2) * np.exp(-((y - (HOR + 0.035)) / 0.04) ** 2) * (0.6 + 0.4 * np.sin(y * 900) ** 2)
        o = mix(skyc, ground) + col("#ffcf70") * glow * 0.9 + col("#fff4d0") * disc + col("#ffd890") * path
    return np.clip(o, 0, 1)
o = grade(sys.argv[3])
Image.fromarray((o * 255).astype(np.uint8)).save(out)
