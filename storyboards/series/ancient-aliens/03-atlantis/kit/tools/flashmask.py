#!/usr/bin/env python3
"""flashmask.py: cut the metal mask for the `envflash` prop (engine/page/props-at-towns.js) out of an env's painting.

  python3 flashmask.py <env name or folder> [--out flash-mask.png] --poly "x,y x,y ..." [--poly ...]
        [--exclude "x,y ..."] [--hue 20 60] [--sat 0.25 1] [--val 0.25 1] [--solid] [--seams "x,x,..."] [--hseams "y,y,..."]
        [--gap 2.0] [--debug]

All coordinates are pixels of the env's picture (env.json "size", e.g. 3072 x 2048), whatever the size of paint.png / paint-hi.png.
Writes next to the painting (in the env folder):
  <out>              white = metal that flashes (grey, soft 1.5 px edge): the colour test (hue degrees, saturation, value, defaults
                     20..60 / 0.25.. / 0.25..) inside the hand polygons (--poly, one per wall piece), minus --exclude polygons (banners,
                     sails, masts); the dark seams and rivets are closed (closing + holes filled). --solid skips the colour test: the mask
                     is the polygons minus the exclusions (use it when the paint's colours are not clean enough).
  <out stem>.plates.png  RGB, nearest-sampled by the shader: R = plate column (0..255, counted along the wall from the left, region by
                     region with --gap plates between pieces), G = how far across that plate (0..255), B = plate row (0..255). A plate is
                     the span between two painted seams. Seams are found in the paint (dark vertical / horizontal lines, steady pitch),
                     or given by hand: --seams applies to every region in order as "x,x,;x,x" (a ';' between regions), --hseams likewise.
  <out stem>.json    { size, regions: [{ bbox, cols, rows }], pc: [first, last] plate coordinate, pitch: [w, h] median plate size in px }
  <out stem>.debug.png  (--debug) the painting with the mask tinted red and the seams drawn: look at it before using the mask.

Also (bench only, until the real plates arrive): `python3 flashmask.py standin map|page <out.png>` paints a stand-in flat plate (3072 x 2048) of similar paper
for the maproute / mapoutline / pagemarks benches: a sea map (sand land, green lowlands, relief ticks, shore echoes; Iberia and Africa about a strait) or a
yellowed typed page on a dark desk with a lamp's warm pool (22 lines of gibberish type with gaps where "1940", "68" and "69" go). It also writes
<out>.json (the gap positions in plate px: marks, size, pitch, and the strait / Athens points for the map). Not art: only to see the overlays on paper.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), *[".."] * 6))

def parse_poly(s):
    return [tuple(float(v) for v in p.split(",")) for p in s.split()]

def raster(polys, W, H):
    im = Image.new("L", (W, H), 0); d = ImageDraw.Draw(im)
    for p in polys: d.polygon(p, fill=255)
    return np.array(im) > 127

def hsv(rgb):
    x = rgb.astype(np.float32) / 255.0
    mx, mn = x.max(2), x.min(2); df = mx - mn + 1e-6
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    h = np.where(mx == r, ((g - b) / df) % 6, np.where(mx == g, (b - r) / df + 2, (r - g) / df + 4)) * 60.0
    return h, df / (mx + 1e-6), mx

def peaks(profile, min_dist, prom):
    """local minima of a high-passed profile, at least min_dist apart, deeper than prom"""
    n = len(profile); out = []
    for i in np.argsort(profile):
        if profile[i] > -prom: break
        if 2 <= i < n - 2 and profile[i] <= profile[i - 1] and profile[i] <= profile[i + 1] and all(abs(i - j) >= min_dist for j in out): out.append(int(i))
    return sorted(out)

def find_seams(lum, mask, axis, lo, hi):
    """seams along `axis` (1 = vertical lines, found in the column profile; 0 = horizontal) between lo and hi"""
    m = mask.astype(np.float32)
    prof = (lum * m).sum(axis=1 - axis) / np.maximum(m.sum(axis=1 - axis), 1)
    prof = ndi.gaussian_filter1d(prof, 2.0)
    hp = prof - ndi.uniform_filter1d(prof, 70)
    hp[:lo] = 0; hp[hi:] = 0
    cov = ndi.uniform_filter1d(m.mean(axis=1 - axis), 9)
    hp = np.where(cov > 0.5, hp, 0)
    return peaks(hp, 70, 0.012)

def regularise(seams, lo, hi):
    """keep seams that agree with the dominant pitch (median gap); fill single missing ones; the region edges close the plates"""
    if len(seams) < 2: return [lo, hi]
    gaps = np.diff(seams); pitch = float(np.median(gaps)); out = [seams[0]]
    for s in seams[1:]:
        g = s - out[-1]; k = max(1, round(g / pitch))
        if abs(g - k * pitch) > 0.28 * pitch and k == 1: continue
        for j in range(1, k): out.append(out[-1] + g / k)
        out.append(s)
    first = out[0]
    while first - pitch > lo + 0.4 * pitch: first -= pitch; out.insert(0, first)
    last = out[-1]
    while last + pitch < hi - 0.4 * pitch: last += pitch; out.append(last)
    out = [s for s in out if lo + 0.25 * pitch < s < hi - 0.25 * pitch]
    return [lo] + out + [hi]

def standin(kind, out):
    W, H = 3072, 2048
    rs = np.random.RandomState(7)   # fixed seed: the same stand-in every run
    def noise(sc, amp):
        n = ndi.zoom(rs.rand(H // sc + 2, W // sc + 2), sc, order=3)[:H, :W]
        return (n - n.mean()) * amp
    info = {}
    if kind == "map":
        img = np.zeros((H, W, 3), np.float32); sea = np.array([63, 141, 176], np.float32)
        img[:] = sea + (noise(40, 60) + noise(9, 25))[..., None] * np.array([0.6, 0.8, 0.9])
        land = Image.new("L", (W, H), 0); d = ImageDraw.Draw(land)
        d.polygon([(1100, 0), (3072, 0), (3072, 640), (2700, 700), (2450, 640), (2200, 760), (1900, 700), (1650, 640), (1420, 700), (1180, 640), (1080, 520), (1180, 420), (1060, 300)], fill=255)   # Europe, Iberia at the left
        d.polygon([(1180, 1420), (1500, 1330), (1900, 1380), (2300, 1330), (2700, 1400), (3072, 1360), (3072, 2048), (1000, 2048), (1000, 1600)], fill=255)   # Africa
        L = np.array(land.filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32)[..., None] / 255
        low = np.clip(noise(60, 4) + 0.2, 0, 1)[..., None]
        sand = np.array([227, 205, 146], np.float32) + noise(6, 22)[..., None]; green = np.array([159, 179, 106], np.float32)
        img = img * (1 - L) + (sand * (1 - low * 0.8) + green * low * 0.8) * L
        for k, w in enumerate((38, 24, 12)):   # shore echoes
            e = ndi.gaussian_filter(L[..., 0], w * 0.5); edge = np.clip(1 - np.abs(e - 0.25 * (k + 1)) * 14, 0, 1)[..., None] * (1 - L)
            img = img * (1 - 0.22 * edge) + np.array([200, 225, 235]) * 0.22 * edge
        im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); dr = ImageDraw.Draw(im)
        for i in range(260):   # relief ticks and wave ticks
            x, y = rs.randint(0, W), rs.randint(0, H)
            if L[y, x, 0] > 0.5 and rs.rand() < 0.5: dr.line([(x - 14, y), (x, y - 16), (x + 14, y)], fill=(138, 106, 58), width=3)
            elif L[y, x, 0] < 0.2: dr.arc([x - 16, y - 8, x + 16, y + 8], 200, 340, fill=(120, 170, 194), width=2)
        info = {"strait": [1180, 800], "athens": [2560, 760], "box": [330, 760, 600, 760]}
        img = np.array(im).astype(np.float32)
    else:
        desk = np.array([106, 74, 46], np.float32)
        img = np.zeros((H, W, 3), np.float32); img[:] = desk
        yy = np.arange(H)[:, None]; img += (np.sin(yy / 9.0 + noise(120, 30)) * 6 + noise(4, 14))[..., None]
        x0, y0, x1, y1 = 760, 70, 2310, 1980
        pg = np.array([233, 217, 168], np.float32)
        page = np.zeros((H, W), bool); page[y0:y1, x0:x1] = True
        sheet = pg + noise(5, 14)[..., None] - (noise(90, 40)[..., None] * 0.5)
        sheet = sheet - np.clip(noise(260, 120), -10, 40)[..., None] * 0.2
        for fy in (y0 + (y1 - y0) // 3, y0 + 2 * (y1 - y0) // 3):   # fold creases in thirds
            sheet[fy - 2:fy + 2] *= 0.93; sheet[fy + 2:fy + 14] *= np.linspace(0.97, 1.0, 12)[:, None, None]
        img[page] = sheet[page]
        im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); dr = ImageDraw.Draw(im)
        for hy in (y0 + 380, y0 + 1480): dr.ellipse([x0 + 70, hy - 22, x0 + 114, hy + 22], fill=(96, 68, 44))   # punch holes
        from PIL import ImageFont
        size = 36; font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf", size); pitch = size * 0.6
        left = x0 + 190; cols = int((x1 - 100 - left) / pitch)
        syl = ["an", "ter", "co", "ver", "min", "al", "sur", "fa", "ce", "tion", "ba", "se", "or", "de", "pro", "lin", "ex", "tra", "mar", "el"]
        gaps = {(1, 31): "1940", (12, 41): "68", (13, 30): "69"}
        marks = []
        for ln in range(1, 23):
            base = y0 + 400 + (ln - 1) * 66
            txt = ""
            while len(txt) < cols - 4:
                w = "".join(syl[rs.randint(len(syl))] for _ in range(rs.randint(1, 4)))
                txt += w + " "
            txt = txt[:cols]
            if ln == 1: txt = "Hartford, Connecticut, April " + " " * 10; txt = txt.ljust(cols)
            for (gl, gc), gt in gaps.items():
                if gl == ln:
                    txt = txt[:gc] + " " * len(gt) + txt[gc + len(gt):]
                    marks.append({"text": gt, "x": round(left + gc * pitch, 1), "y": round(base, 1)})
            for ci, ch in enumerate(txt):
                if ch != " ": dr.text((left + ci * pitch + rs.randn() * 0.5, base + rs.randn() * 0.8), ch, font=font, fill=(58 + rs.randint(0, 40),) * 2 + (50 + rs.randint(0, 40),), anchor="ls")
        info = {"marks": marks, "size": size, "pitch": pitch}
        img = np.array(im).astype(np.float32)
        yy, xx = np.mgrid[0:H, 0:W]; pool = np.exp(-(((xx - 2500) / 1500.0) ** 2 + ((yy - 300) / 1300.0) ** 2))   # the lamp's warm pool, upper right
        img = img * (0.42 + 0.7 * pool)[..., None] * np.array([1.02, 0.97, 0.86])
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out)
    json.dump(info, open(os.path.splitext(out)[0] + ".json", "w"), indent=1)
    print("stand-in", kind, out)

def main():
    if len(sys.argv) > 3 and sys.argv[1] == "standin":
        os.makedirs(os.path.dirname(os.path.abspath(sys.argv[3])), exist_ok=True); return standin(sys.argv[2], sys.argv[3])
    a = argparse.ArgumentParser()
    a.add_argument("env"); a.add_argument("--out", default="flash-mask.png")
    a.add_argument("--poly", action="append", required=True); a.add_argument("--exclude", action="append", default=[])
    a.add_argument("--hue", type=float, nargs=2, default=[20, 60]); a.add_argument("--sat", type=float, nargs=2, default=[0.25, 1])
    a.add_argument("--val", type=float, nargs=2, default=[0.25, 1]); a.add_argument("--solid", action="store_true")
    a.add_argument("--seams"); a.add_argument("--hseams"); a.add_argument("--gap", type=float, default=2.0); a.add_argument("--debug", action="store_true")
    o = a.parse_args()
    d = o.env if os.path.isdir(o.env) else os.path.join(ROOT, "assets", "environments", o.env)
    E = json.load(open(os.path.join(d, "env.json"))); W, H = E["size"]
    src = next(os.path.join(d, f) for f in ("paint-hi.png", "paint.png") if os.path.exists(os.path.join(d, f)))
    img = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS); rgb = np.array(img)
    regions = [raster([parse_poly(p)], W, H) for p in o.poly]
    excl = raster([parse_poly(p) for p in o.exclude], W, H) if o.exclude else np.zeros((H, W), bool)
    h, s, v = hsv(rgb)
    colour = np.ones((H, W), bool) if o.solid else (h >= o.hue[0]) & (h <= o.hue[1]) & (s >= o.sat[0]) & (s <= o.sat[1]) & (v >= o.val[0]) & (v <= o.val[1])
    lum = (0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]).astype(np.float32) / 255.0
    mask = np.zeros((H, W), bool); info = []; plates = np.zeros((H, W, 3), np.uint8); seamsXY = []
    hand_v = [[float(x) for x in g.split(",") if x] for g in o.seams.split(";")] if o.seams else None
    hand_h = [[float(x) for x in g.split(",") if x] for g in o.hseams.split(";")] if o.hseams else None
    order = sorted(range(len(regions)), key=lambda i: np.where(regions[i].any(0))[0][0])
    off = 0.0; pc_first = None
    for k, i in enumerate(order):
        R = regions[i]; ys, xs = np.where(R); x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
        m = R & colour & ~excl
        m = ndi.binary_closing(m, iterations=5); m = ndi.binary_fill_holes(m) & R & ~excl
        m = ndi.binary_opening(m, iterations=2)
        mask |= m
        vs = hand_v[k] if hand_v else regularise(find_seams(lum, m, 1, x0, x1), x0, x1)
        hsm = hand_h[k] if hand_h else regularise(find_seams(lum, m, 0, y0, y1), y0, y1)
        vs = sorted(set([x0] + [float(q) for q in vs] + [x1])); hsm = sorted(set([y0] + [float(q) for q in hsm] + [y1]))
        X = np.arange(W, dtype=np.float32)
        ci = np.clip(np.searchsorted(vs, X, side="right") - 1, 0, len(vs) - 2)
        cf = np.clip((X - np.array(vs)[ci]) / np.maximum(np.array(vs)[ci + 1] - np.array(vs)[ci], 1), 0, 0.999)
        Y = np.arange(H, dtype=np.float32)
        ri = np.clip(np.searchsorted(hsm, Y, side="right") - 1, 0, len(hsm) - 2)
        sub = plates[y0:y1, x0:x1]
        colv = np.clip(ci[x0:x1] + off, 0, 255).astype(np.uint8); fracv = (cf[x0:x1] * 255).astype(np.uint8)
        sub[..., 0] = colv[None, :]; sub[..., 1] = fracv[None, :]; sub[..., 2] = np.clip(ri[y0:y1], 0, 255).astype(np.uint8)[:, None]
        ncol = len(vs) - 1
        if pc_first is None: pc_first = off
        info.append({"bbox": [x0, y0, x1, y1], "cols": ncol, "rows": len(hsm) - 1, "seamsX": [round(q, 1) for q in vs], "seamsY": [round(q, 1) for q in hsm], "colOffset": off})
        seamsXY.append((vs, hsm, (x0, y0, x1, y1)))
        off += ncol + o.gap
    plates[~mask] = 0
    soft = ndi.gaussian_filter(mask.astype(np.float32), 1.5)
    base = os.path.splitext(o.out)[0]
    Image.fromarray((soft * 255).astype(np.uint8), "L").save(os.path.join(d, o.out))
    Image.fromarray(plates, "RGB").save(os.path.join(d, base + ".plates.png"))
    pitch = [float(np.median(np.concatenate([np.diff(sx) for sx, _, _ in seamsXY]))), float(np.median(np.concatenate([np.diff(sy) for _, sy, _ in seamsXY])))]
    json.dump({"size": [W, H], "regions": info, "pc": [pc_first, off - o.gap], "pitch": [round(p, 1) for p in pitch]}, open(os.path.join(d, base + ".json"), "w"), indent=1)
    print(f"{d}/{o.out}: {int(mask.sum())} px, {len(info)} regions, plates {[(r['cols'], r['rows']) for r in info]}, pitch {pitch}")
    if o.debug:
        dbg = rgb.astype(np.float32); dbg[mask] = dbg[mask] * 0.55 + np.array([255, 40, 40]) * 0.45
        im = Image.fromarray(dbg.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for vs, hsm, (x0, y0, x1, y1) in seamsXY:
            for x in vs: dr.line([(x, y0), (x, y1)], fill=(0, 255, 255), width=2)
            for y in hsm: dr.line([(x0, y), (x1, y)], fill=(255, 0, 255), width=2)
        im.save(os.path.join(d, base + ".debug.png"))

if __name__ == "__main__":
    main()
