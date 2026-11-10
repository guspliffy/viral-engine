#!/usr/bin/env python3
"""Clean an env's sky card behind its near tree cards (first used on dusk-city-park, 9 Nov 2026).

The env builder's inpaint leaves blurred tree trunks and canopy in the sky card behind the near tree cards. When the
camera moves off the painting's camera, the tree cards slide over the sky (up to ~170 px of the painting for a camera
5 m forward) and those blurred twins show as ghosts beside the trees. Above the skyline the sky is a smooth gradient,
so every sky-card pixel under (and just around) a near tree card is repainted from the open sky around it (not
masked, not darker than its row's sky: no far tree, no building) by a push-pull fill along the row (the sky changes down
the rows, not across), softened down the rows and feathered into the untouched pixels. Rows below --until (the skyline and bushes) are left as they are.

  python3 tools/clean-sky-behind-trees.py assets/environments/<env> --until <painting y> [--grow 24] [--dry out.png]
"""
import argparse, json, os
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("env")
ap.add_argument("--until", type=int, required=True, help="painting row where the skyline starts: rows below stay")
ap.add_argument("--grow", type=int, default=24, help="px the tree mask grows to take in the inpaint's blur halo")
ap.add_argument("--dry", help="write the cleaned sky here instead of over the card")
ap.add_argument("--sharp-lo", type=float, default=10, help="detail below this is a blurred twin: repaint")
ap.add_argument("--sharp-hi", type=float, default=22, help="detail above this is a real far tree: keep")
a = ap.parse_args()

e = json.load(open(os.path.join(a.env, "env.json")))
px, py = e["pad"]
card = next(c for c in e["cards"] if c.get("sky"))
src = os.path.join(a.env, card["src"])
sky = np.array(Image.open(src).convert("RGB")).astype(np.float32)
H, W = sky.shape[:2]

mask = np.zeros((H, W), np.uint8)
for c in e["cards"]:
    if c.get("sky"):
        continue
    al = np.array(Image.open(os.path.join(a.env, c["src"])).convert("RGBA"))[:, :, 3]
    x0, y0, x1, y1 = c["rect"]
    mask[y0 + py:y1 + py, x0 + px:x1 + px] = np.maximum(mask[y0 + py:y1 + py, x0 + px:x1 + px], (al > 12) * 255)
mask = Image.fromarray(mask.astype(np.uint8))
if a.grow:
    mask = mask.filter(ImageFilter.MaxFilter(a.grow * 2 + 1))
m = np.array(mask) > 0
yend = min(H, a.until + py)

lum = sky @ np.array([0.299, 0.587, 0.114], np.float32)
known = ~m
c0, c1 = px + int(e["size"][0] * 0.4), px + int(e["size"][0] * 0.6)   # the open sky in the middle of the painting
for y in range(yend):                                         # open sky only: near the middle's colour (no far tree,
    mid = known[y, c0:c1]                                     # no building)
    if mid.sum() < 20:
        continue
    ref = np.median(sky[y, c0:c1][mid], 0)
    known[y] &= np.linalg.norm(sky[y] - ref, axis=1) < 55
known[yend:] = False

def down(a):                                                  # halve along x only: the sky changes down the rows
    w = a.shape[1]
    a = np.pad(a, ((0, 0), (0, w % 2)) + ((0, 0),) * (a.ndim - 2))
    return a.reshape(a.shape[0], a.shape[1] // 2, 2, *a.shape[2:]).sum(2)

def up(a, w):
    xs = (np.arange(w) + 0.5) / w * a.shape[1] - 0.5
    i0 = np.clip(np.floor(xs).astype(int), 0, a.shape[1] - 1); i1 = np.clip(i0 + 1, 0, a.shape[1] - 1)
    t = np.clip(xs - i0, 0, 1)[None, :, None]
    return a[:, i0] * (1 - t) + a[:, i1] * t

# push-pull fill along each row: average the row's open sky down a 1-D pyramid, then fill every hole from the
# coarser level on the way up (a row with no open sky at all takes the nearest row's fill)
S = sky[:yend]; K = known[:yend].astype(np.float32)
C, Wt = [S * K[..., None]], [K]
while C[-1].shape[1] > 1:
    C.append(down(C[-1])); Wt.append(down(Wt[-1]))
est = C[-1] / np.maximum(Wt[-1], 1e-6)[..., None]
have = Wt[-1][:, 0] > 0
rows = np.arange(yend)
for ch in range(3):
    est[:, 0, ch] = np.interp(rows, rows[have], est[have, 0, ch])
for l in range(len(C) - 2, -1, -1):
    u = up(est, C[l].shape[1])
    wl = np.minimum(Wt[l], 1)[..., None]
    est = np.where(Wt[l][..., None] > 0, C[l] / np.maximum(Wt[l], 1e-6)[..., None], 0) * wl + u * (1 - wl)
k = 40                                                        # soften down the rows: no streaks
pad = np.pad(est, ((k, k), (0, 0), (0, 0)), mode="edge")
cs = np.concatenate([np.zeros((1,) + pad.shape[1:], np.float32), np.cumsum(pad, 0)], 0)
fit = (cs[2 * k + 1:] - cs[:-2 * k - 1]) / (2 * k + 1)
fit = np.array(Image.fromarray(np.clip(fit, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))).astype(np.float32)

w = np.array(mask.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
# keep what is sharp: a far tree the inpaint carried on behind a near one stays, only the blurred twins go (a cut
# along the mask left hard-edged blocks of canopy when the near tree slid off them)
L = Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8))
lap = np.abs(np.array(L.filter(ImageFilter.Kernel((3, 3), [0, 1, 0, 1, -4, 1, 0, 1, 0], 1, 128))).astype(np.float32) - 128)
detail = np.array(Image.fromarray(np.clip(lap * 8, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(np.float32)
sharp = np.clip((detail - a.sharp_lo) / (a.sharp_hi - a.sharp_lo), 0, 1)
w *= 1 - sharp
w[yend:] = 0
ramp = np.clip((yend - np.arange(H)) / 40.0, 0, 1)            # fade the repaint out over 40 rows above the skyline
w *= ramp[:, None]
out = sky.copy()
out[:yend] = sky[:yend] * (1 - w[:yend, :, None]) + fit * w[:yend, :, None]

img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
dst = a.dry or src
img.save(dst, quality=92) if dst.endswith(".webp") else img.save(dst)
print(f"repainted {(w > 0.5).mean() * 100:.1f}% of {os.path.basename(src)} above painting row {a.until} -> {dst}")
