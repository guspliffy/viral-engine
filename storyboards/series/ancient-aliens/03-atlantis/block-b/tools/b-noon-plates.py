#!/usr/bin/env python3
"""Block B3: prepares the two painted plates of engine/page/props-at-b-noon.js (kind atbnoon).
  python3 storyboards/series/ancient-aliens/03-atlantis/block-b/tools/b-noon-plates.py [17|19]
Source: /mnt/project-files/videos/ancient-aliens/03-atlantis/plates/plate-17-citadel-wall-noon.png and plate-19-bridge-noon.png (1536 x 1024).
Output: assets/props/atlantis/b-plate-17.webp, b-plate-19.webp (1536 x 1024, lossless-ish WebP). Deterministic.
  17: the painted alien is filled (the wall, posts and town mirrored in; the near plate top under its hands filled from below), the rope coil, the
      bucket, the loose rivet and every gold rivet on the near plates are painted out (the 3D scene models them).
  19: the balustrade (rail, balusters, plinth) is painted out (3D now) and the left trireme is painted out (a clear patch of water for the column).
All coordinates are plate pixels. RIVETS17 (below) is the same list props-at-b-noon.js builds in 3D."""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
SRC = "/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/"
OUT = ROOT + "/assets/props/atlantis/"
W, H = 1536, 1024

def poly_mask(polys, grow=0):
    m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
    for p in polys: d.polygon([tuple(q) for q in p], fill=255)
    if grow: m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    return np.array(m) > 0

def mirror_fill_h(img, mask, xm=1010, span=500):
    """the masked pixels take the pixels left of the axis x = xm, mirrored (one axis for every row: posts and plates keep their shape)."""
    out = img.copy(); ys, xs = np.where(mask)
    ph = (xs - xm) % (2 * span); sx = np.where(ph < span, xm - ph, xm - (2 * span - ph))
    out[ys, xs] = img[ys, np.clip(sx, 0, W - 1)]; return out

def mirror_fill_v(img, mask, span=60):
    out = img.copy()
    for x in range(W):
        ys = np.where(mask[:, x])[0]
        if len(ys) == 0: continue
        runs = np.split(ys, np.where(np.diff(ys) > 1)[0] + 1)
        for r in runs:
            y0, y1 = r[0], r[-1]; ym = min(y1 + 16, H - 8); sp = min(span, H - 1 - ym)
            for y in range(y0, y1 + 1):
                ph = (ym - y) % (2 * sp); sy = ym + ph if ph < sp else ym + (2 * sp - ph)
                out[y, x] = img[min(int(sy), H - 1), x]
    return out

def row_fill(img, mask, src):
    """each row: the masked pixels take that row's pixels from the columns src = (x0, x1), tiled back and forth (same row = same depth)."""
    out = img.copy(); L = src[1] - src[0]
    for y in range(H):
        xs = np.where(mask[y])[0]
        for x in xs:
            ph = (x - src[0]) % (2 * L); sx = src[0] + (ph if ph < L else 2 * L - 1 - ph)
            out[y, x] = img[y, sx]
    return out

def soften(img, mask, r=2):
    edge = np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 3))) > 0
    edge &= ~(np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * r + 1))) > 0)
    blur = np.array(Image.fromarray(img).filter(ImageFilter.GaussianBlur(1.6)))
    out = img.copy(); out[edge] = blur[edge]; return out

def diffuse_fill(img, mask, sigma=11):
    """smooth fill of small masked blobs from their surroundings (normalised convolution): the gold rivets on red metal."""
    out = img.copy(); todo = mask.copy()
    for sg in (sigma, sigma * 2.2, sigma * 5):
        known = Image.fromarray(((~mask) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sg)); kn = np.array(known).astype(np.float32); den = np.maximum(kn, 1.0)
        ok = todo & (kn > 40)
        for c in range(3):
            ch = Image.fromarray((img[..., c] * (~mask)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sg))
            v = np.array(ch).astype(np.float32) / den * 255.0; out[..., c][ok] = np.clip(v[ok], 0, 255).astype(np.uint8)
        todo &= ~ok
    return out

ALIEN = [
    [(1290, 270), (1245, 296), (1205, 326), (1168, 370), (1138, 388), (1104, 424), (1074, 470), (1058, 520), (1040, 562), (1024, 610), (1016, 656), (1040, 674), (1110, 668), (1170, 676), (1235, 660), (1250, 678),
     (1300, 698), (1380, 712), (1426, 702), (1464, 685), (1473, 660), (1456, 648), (1500, 642), (1514, 630), (1497, 612), (1484, 598), (1478, 575), (1465, 545), (1450, 515), (1437, 490), (1450, 460), (1454, 420),
     (1450, 385), (1442, 350), (1426, 326), (1405, 304), (1380, 280), (1335, 268)],
    [(1318, 205), (1328, 178), (1352, 172), (1376, 184), (1382, 208), (1374, 230), (1358, 240), (1344, 262), (1322, 296), (1294, 302), (1304, 276), (1328, 238), (1320, 224)],
    [(1440, 590), (1536, 590), (1536, 664), (1440, 664)],
    [(1396, 318), (1430, 280), (1445, 262), (1440, 240), (1452, 216), (1480, 212), (1498, 235), (1496, 264), (1476, 278), (1458, 280), (1428, 310), (1418, 334)],
]
BENCH_BACK = lambda x: 682 - 0.147 * (x - 1170)    # back edge of the near plate top (px), where the hands rest on it
ROPE = [[(50, 742), (58, 700), (118, 652), (220, 636), (332, 656), (384, 716), (390, 764), (330, 794), (222, 790), (100, 768)]]
BUCKET = [[(410, 700), (560, 700), (560, 748), (410, 748)], [(398, 592), (440, 574), (522, 574), (574, 596), (578, 650), (566, 694), (542, 724), (480, 726), (426, 710), (398, 656)], [(372, 700), (420, 690), (440, 722), (390, 722)]]
RIVET = [[(556, 698), (606, 690), (644, 704), (646, 732), (602, 742), (560, 738)]]
# the gold rivets of the near plates (hand-listed from the painting: x, y, radius, T top face | F front face): painted out here, built in 3D by props-at-b-noon.js
RIVETS17 = [(416, 865, 17, "T"), (465, 932, 17, "T"), (505, 1005, 17, "T"), (511, 840, 16, "T"), (553, 913, 17, "T"), (598, 973, 18, "T"), (657, 808, 13, "T"), (743, 787, 13, "T"), (843, 762, 13, "T"),
            (921, 744, 13, "T"), (993, 728, 13, "T"), (1134, 689, 12, "T"), (1196, 672, 10, "T"), (1248, 838, 16, "T"), (1321, 814, 15, "T"), (1365, 876, 12, "T"), (1452, 857, 8, "T"), (1522, 789, 10, "T"),
            (1165, 918, 10, "F"), (1066, 936, 11, "F"), (946, 961, 11, "F"), (830, 986, 11, "F"), (730, 1008, 11, "F"), (1272, 896, 10, "F"), (1295, 987, 9, "F"), (1365, 975, 11, "F")]

def p17():
    img = np.array(Image.open(SRC + "plate-17-citadel-wall-noon.png").convert("RGB"))
    alien = poly_mask(ALIEN, grow=7)
    yy, xx = np.mgrid[0:H, 0:W]
    low = alien & (yy > BENCH_BACK(xx) - 6) & (xx > 1235)
    img = mirror_fill_h(img, alien & ~low)
    img = mirror_fill_v(img, low, 90)
    img = soften(img, alien)
    yy, xx = np.mgrid[0:H, 0:W]
    for x, y, r, _ in RIVETS17:   # a rivet: the disk takes the mean of the metal in a ring round it, fading out over the ring
        d = np.hypot(xx - x, yy - y); ring = (d > r * 1.2 + 2) & (d < r * 1.55 + 5); mean = img[ring].mean(0)
        k = np.clip((r * 1.3 + 3 - d) / (r * 0.3 + 2), 0, 1)[..., None]; k[d > r * 1.7 + 6] = 0
        img = (img * (1 - k) + mean * k).astype(np.uint8)
    for polys in (ROPE, RIVET):
        m = poly_mask(polys, grow=2); img = row_fill(img, m, (660, 900)); img = soften(img, m)
    mb = poly_mask(BUCKET, grow=2); yy, xx = np.mgrid[0:H, 0:W]    # the bucket stood before the wall plates (left) and the stone post (right)
    img = row_fill(img, mb & (yy < 662) & (xx < 508), (284, 392)); img = row_fill(img, mb & (yy < 662) & (xx >= 508), (584, 622)); img = row_fill(img, mb & (yy >= 662), (660, 900)); img = soften(img, mb)
    return img

def p19():
    img = np.array(Image.open(SRC + "plate-19-bridge-noon.png").convert("RGB"))
    ship = [[(0, 318), (30, 316), (122, 420), (138, 520), (205, 528), (268, 516), (274, 572), (262, 642), (222, 692), (162, 718), (60, 734), (0, 738)], [(130, 515), (170, 515), (170, 560), (130, 560)]]
    m = poly_mask(ship, grow=4)
    water = m.copy(); water[:520] = False; quay = m & ~water
    img = row_fill(img, water, (290, 430)); img = row_fill(img, quay, (276, 340)); img = soften(img, m)
    top = [(0, 857), (200, 800), (400, 750), (600, 700), (800, 674), (1108, 620), (1338, 574), (1492, 551), (1536, 541)]
    foot = [(1536, 603), (1492, 616), (1385, 655), (1292, 697), (1138, 758), (1000, 828), (846, 920), (790, 985), (760, 1024)]
    band = poly_mask([top + foot + [(0, 1024)]], grow=2)
    # the water above the rail's far edge is the source: each column mirrors it downward through the band
    out = img.copy()
    edge = np.interp(np.arange(W), [p[0] for p in top], [p[1] for p in top])
    for x in range(W):
        ys = np.where(band[:, x])[0]
        if len(ys) == 0: continue
        e = int(edge[x]) - 12; sp = 22
        for y in ys:
            ph = (y - e) % (2 * sp); sy = e - ph if ph < sp else e - (2 * sp - ph)
            out[y, x] = img[max(sy, 0), x]
    yy, xx = np.mgrid[0:H, 0:W]    # the foot of the rail at the lower left: the deck seen from other cameras is paving, not water
    deck = band & (yy >= 940) & (xx < 800) & (yy > 940 + (xx - 0) * 0.0)
    out = row_fill(out, deck, (1000, 1400))
    return soften(out, band, 3)

def skyline(path, step=24):
    """the sky / city boundary of a plate (flood fill of blue and cloud-white from the top edge), as [[u, v], ...] for the hill card in props-at-b-noon.js"""
    from collections import deque
    img = np.array(Image.open(path).convert("RGB")).astype(int); r, g, b = img[..., 0], img[..., 1], img[..., 2]
    like = ((b > 150) & (b > r + 35)) | ((np.minimum(np.minimum(r, g), b) > 205) & (b >= r - 6) & (b > g - 4))
    sky = np.zeros((H, W), bool); dq = deque((x, 0) for x in range(W) if like[0, x])
    for x, y in dq: sky[y, x] = True
    while dq:
        x, y = dq.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and like[ny, nx] and not sky[ny, nx]: sky[ny, nx] = True; dq.append((nx, ny))
    top = []
    for x in range(0, W + 1, step):
        x0, x1 = max(0, x - step // 2), min(W, x + step // 2 + 1); ys = []
        for xx in range(x0, x1):
            col = np.where(~sky[:, xx])[0]; ys.append(int(col[0]) if len(col) else H)
        top.append([min(x, W - 1) if x < W else W, int(min(ys)) - 2])
    return top

if __name__ == "__main__":
    if "--skyline" in sys.argv:
        for n, f in (("17", "plate-17-citadel-wall-noon.png"), ("19", "plate-19-bridge-noon.png")): print(n, skyline(SRC + f))
        sys.exit(0)
    which = [a for a in sys.argv[1:] if a in ("17", "19")] or ["17", "19"]
    os.makedirs(OUT, exist_ok=True)
    if "17" in which:
        Image.fromarray(p17()).save(OUT + "b-plate-17.webp", lossless=True, quality=100, method=4); print("wrote b-plate-17.webp")
    if "19" in which:
        Image.fromarray(p19()).save(OUT + "b-plate-19.webp", lossless=True, quality=100, method=4); print("wrote b-plate-19.webp")
