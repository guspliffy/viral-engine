# Motion masks for painted backgrounds: which pixels sway (leaves, grass) and which shimmer (sun patches under
# leaves). Shared by depth.py (single plates) and env.py (layered environments).
#
# Why not "green = leaves" (the first depth.py rule): a green door, a painted green wall, a mossy roof or a flat
# lawn in the distance all moved like foliage. Foliage in a painting is green AND broken up: many small light and
# dark dabs (leaf clusters, blades). A flat green surface is smooth. So a pixel sways only when it is
#   1. leaf-coloured (yellow-green to blue-green, enough saturation, not black),
#   2. textured: the local brightness varies like leaves do (standard deviation in a small window), and
#   3. not inside a "still" box from the plate's own overrides (a sidecar <plate>.motion.json or the env spec).
# "sway" boxes force motion on (a wheat field painted flat), and "shimmer" boxes mark sun patches under leaves.
# Every mask is written next to a review picture (the plate dimmed, sway red, shimmer yellow, still boxes outlined),
# so a person can check it at a glance before it goes into a clip.
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ramp = lambda x, a, b: np.clip((x - a) / (b - a), 0, 1)


def grow(m, r):
    """grow a 0..1 mask by r pixels and soften its edge (a leaf moving over the wall behind it)"""
    if r <= 0: return m
    import cv2
    g = cv2.dilate((np.clip(m, 0, 1) * 255).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    return np.asarray(Image.fromarray(g).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255


def local_std(lum, r, w=None):
    """standard deviation of brightness in a (2r+1) box round each pixel; with weights w, only over the weighted pixels
    (the leaf-coloured ones), so the edge of a flat green door against a cream wall doesn't count as texture"""
    import cv2
    k = 2 * r + 1
    blur = lambda a: cv2.boxFilter(a.astype(np.float32), -1, (k, k))
    if w is None: w = np.ones_like(lum)
    sw = np.maximum(blur(w), 1e-4)
    m, m2 = blur(lum * w) / sw, blur(lum * lum * w) / sw
    return np.sqrt(np.clip(m2 - m * m, 0, None))


def boxes_to_mask(boxes, w, h):
    """[[x0, y0, x1, y1], ...] in 0..1 picture fractions (top left origin) -> 0/1 mask"""
    m = np.zeros((h, w), float)
    for x0, y0, x1, y1 in boxes or []:
        m[int(round(y0 * h)):int(round(y1 * h)), int(round(x0 * w)):int(round(x1 * w))] = 1
    return m


def foliage(img, scale=1.0):
    """0..1: how much each pixel looks like painted foliage (leaf colour x leaf texture). scale = picture width / 1000,
    so the texture window is the same share of the picture at any size."""
    rgb = np.asarray(img.convert("RGB")).astype(float) / 255
    hsv = np.asarray(img.convert("HSV")).astype(float) / 255
    h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    # yellow-green (sunlit leaves, 55°) to blue-green (shaded leaves, 165°), saturated, not near black
    colour = ramp(h, 48, 70) * (1 - ramp(h, 150, 172)) * ramp(s, 0.16, 0.32) * ramp(v, 0.08, 0.2)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    tex = local_std(lum, max(3, int(round(8 * scale))), (colour > 0.3).astype(float))
    texture = ramp(tex, 0.012, 0.035)   # flat paint under 0.01; painted leaves 0.03-0.15
    # a leaf mass has dark gaps inside it that are not green any more: let the texture carry them if green is near
    near_green = grow(colour, max(2, int(round(5 * scale))))
    return np.clip(np.maximum(colour, 0.6 * near_green * ramp(s, 0.08, 0.2)) * texture, 0, 1)


def motion_masks(img, ov=None, depth=None, scale=None, grow_px=None):
    """-> (sway, shimmer, still) 0..1 arrays. ov: {"still": boxes, "sway": boxes, "shimmer": boxes, "sun": true}.
    sun (the old depth.py rule, for interiors): bright wall and floor nearer than the far sky shimmer."""
    ov = ov or {}
    W, H = img.size
    scale = scale or W / 1000
    still = boxes_to_mask(ov.get("still"), W, H)
    leaf = foliage(img, scale)
    leaf = np.clip(grow(leaf, grow_px if grow_px is not None else max(2, int(round(5 * scale)))) * 1.5, 0, 1)
    leaf = np.maximum(leaf, boxes_to_mask(ov.get("sway"), W, H))
    leaf *= 1 - grow(still, 2)
    sun = boxes_to_mask(ov.get("shimmer"), W, H)
    if ov.get("sun", depth is not None) and depth is not None:
        v = np.asarray(img.convert("HSV")).astype(float)[..., 2] / 255
        sun = np.maximum(sun, grow(ramp(v, 0.8, 0.95) * ramp(depth, 0.25, 0.4), max(2, int(round(6 * scale)))))
    sun = grow(sun, 0) * (1 - still)
    return leaf, sun, still


def review(img, sway, shimmer, still_boxes, out, title=""):
    """the picture dimmed to grey, sway painted red, shimmer yellow, still boxes outlined in cyan"""
    base = np.asarray(img.convert("L").convert("RGB")).astype(float) / 255 * 0.55 + 0.2
    red, yel = np.array([0.95, 0.15, 0.1]), np.array([1.0, 0.85, 0.1])
    o = base * (1 - 0.75 * sway[..., None]) + red * 0.75 * sway[..., None]
    o = o * (1 - 0.7 * shimmer[..., None]) + yel * 0.7 * shimmer[..., None]
    im = Image.fromarray((np.clip(o, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    W, H = im.size
    for x0, y0, x1, y1 in still_boxes or []:
        d.rectangle([x0 * W, y0 * H, x1 * W, y1 * H], outline=(40, 230, 255), width=max(2, W // 300))
    if title: d.text((10, 10), title, fill=(255, 255, 255))
    im.save(out)
    return out


def overrides_for(src):
    """a plate's own mask overrides: <plate>.motion.json next to it ({"still": [[x0, y0, x1, y1]], "sway": ..., "shimmer": ...})"""
    f = src.rsplit(".", 1)[0] + ".motion.json"
    return json.load(open(f)) if os.path.exists(f) else {}
