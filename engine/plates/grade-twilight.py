# Relights a painted environment (engine/plates/env.py output) to blue-grey twilight by a colour grade, so the place
# stays the same picture with the same layers, ground and camera range (firebender duel v2, 8 Nov 2026: Jonny's
# reference boards put the fight on "the same old urban street at blue-grey twilight", warm fire the only warm light).
#   python engine/plates/grade-twilight.py assets/environments/golden-city-crossing assets/environments/twilight-city-crossing
# The sky layer becomes a twilight gradient (deep indigo at the top, a dusty blue-grey band at the horizon: review A, 8 Nov, the first rose band read magenta), every
# other layer and the ground a cool, low-contrast dusk: the sunlit facades and the low sun's long shadow stripes are
# pressed together toward one soft blue-grey, a third of the painting's own colour is kept (brick stays brick, the
# road lines stay ochre). paint.png / paint-hi.png are graded too (qa/env.mjs and set lighting 2 measure them), and
# env.json's palette and light are rewritten. Deterministic; numpy + Pillow.
import sys, os, json, shutil, numpy as np
from PIL import Image

src, dst = sys.argv[1].rstrip("/"), sys.argv[2].rstrip("/")
os.makedirs(dst, exist_ok=True)


def col(h): return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)


SH, LI = col("#141830"), col("#a3abc8")          # dusk shade and dusk light (the cast's grade measures these back)
TOP, MID, HOR = col("#141a40"), col("#323c74"), col("#9496b4")


def lum(im): return (0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2])[..., None]


def dusk(im):
    L = lum(im)
    t = np.clip(0.02 + 0.8 * np.power(L, 1.4), 0, 1)          # contrast pressed: no sun, no hard shadow
    base = SH + (LI - SH) * t
    chroma = (im - L) * 0.45                                        # a third of the painting's own colour
    return np.clip(base + chroma * (0.4 + 0.6 * t), 0, 1)


def sky(im, rows):
    # rows: each pixel's height in the picture, 0 top .. 1 bottom; the horizon sits near 0.55 of the full picture
    L = lum(im)
    k = np.clip(rows / 0.55, 0, 1)
    g = np.where(k < 0.65, TOP + (MID - TOP) * (k / 0.65), MID + (HOR - MID) * ((k - 0.65) / 0.35))
    out = g * (0.75 + 0.45 * L)                                      # clouds and haze keep their shapes, dimmed
    return np.clip(out, 0, 1)


def skymask(im, rows):
    # in the whole painting: bright, low-saturation or bluish pixels above the street's horizon
    L = lum(im)[..., 0]; sat = im.max(-1) - im.min(-1)
    m = np.clip((L - 0.62) * 6, 0, 1) * np.clip((0.35 - sat) * 5 + (im[..., 2] - im[..., 0]) * 4, 0, 1)
    return (m * np.clip((0.6 - rows[..., 0]) * 12, 0, 1))[..., None]


def grade_file(name, kind):
    p = os.path.join(src, name)
    im0 = Image.open(p); mode = im0.mode
    a = np.asarray(im0.convert("RGBA")).astype(np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3:]
    H = rgb.shape[0]
    rows = np.repeat(np.linspace(0, 1, H)[:, None, None], rgb.shape[1], 1)
    if kind == "sky": out = sky(rgb, rows)
    elif kind == "paint": m = skymask(rgb, rows); out = sky(rgb, rows) * m + dusk(rgb) * (1 - m)
    else: out = dusk(rgb)
    res = np.concatenate([out, alpha], -1) if mode == "RGBA" else out
    img = Image.fromarray((res * 255 + 0.5).astype(np.uint8), "RGBA" if mode == "RGBA" else "RGB")
    q = os.path.join(dst, name)
    if name.endswith(".webp"): img.save(q, quality=92, method=6)
    else: img.save(q)


for f in sorted(os.listdir(src)):
    if f.startswith("paint-seed") or f.endswith(".npy"): continue
    if f == "layer-0-sky.webp": grade_file(f, "sky")
    elif f in ("paint.png", "paint-hi.png"): grade_file(f, "paint")
    elif f.endswith(".webp"): grade_file(f, "layer")
    elif f in ("env.json", "spec.json"): continue
    else: shutil.copy(os.path.join(src, f), os.path.join(dst, f))

E = json.load(open(os.path.join(src, "env.json")))
E["name"] = os.path.basename(dst)
E["source"] = f"{os.path.basename(src)} graded to twilight (engine/plates/grade-twilight.py)"
E["light"] = {**E.get("light", {}), "from": "the last blue light of dusk, from the far end of the street", "shadow": 0.18}
pal = Image.open(os.path.join(dst, "paint.png")).convert("RGB").quantize(8, method=Image.Quantize.MEDIANCUT)
cnt = sorted(pal.getcolors(), reverse=True); pl = pal.getpalette(); tot = sum(c for c, _ in cnt)
E["palette"] = [{"color": "#%02x%02x%02x" % tuple(pl[i * 3:i * 3 + 3]), "share": round(c / tot, 3)} for c, i in cnt]
json.dump(E, open(os.path.join(dst, "env.json"), "w"), indent=1)
S = json.load(open(os.path.join(src, "spec.json")))
S["name"] = os.path.basename(dst); S["graded_from"] = os.path.basename(src)
S["light"] = {**S.get("light", {}), "from": E["light"]["from"]}
json.dump(S, open(os.path.join(dst, "spec.json"), "w"), indent=1)
print("graded", src, "->", dst)
