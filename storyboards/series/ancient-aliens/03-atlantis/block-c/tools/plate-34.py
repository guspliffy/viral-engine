#!/usr/bin/env python3
"""Block C plates 34 (Port Royal 1692) and 35 (Port Royal sinking): the texture layers of the painted 3D scenes in
engine/page/props-at-c-plate-34.js (scene keys "34", "35"; see engine/page/props-at-c-plate.js for the format).

  python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-34.py                 # build both plates' layers
  python3 .../plate-34.py --only 34                                                               # one plate
  python3 .../plate-34.py --overlay 34 out.png                                                    # the scene's 3D edges over the plate
  python3 .../plate-34.py --vs <stills dir> 34                                                    # painting | P | S | M | Z -> bench/at-cplate-34-vs.png

Source: assets/environments/<env>/paint.png (1536 x 1024, the approved plate). Output, 2048 x 1365, in assets/props/atlantis/c/:
  c-pNN.webp        the plate itself (projected from the painter's camera onto the 3D pieces)
  c-pNN-clean.webp  the plate with the near things painted out (barrels, crates, posts, ships ...: what a real 3D piece or a card now carries),
                    filled row by row from the neighbours, for the surfaces behind them
  c-pNN-mask.png    red channel: 255 = a cut card keeps this pixel (ships, palm, jetty rail); the colour comes from c-pNN.webp at the same place
All coordinates below are plate pixels (1536 x 1024). Deterministic: no random numbers. Needs PIL + numpy (no OpenCV).
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
ENV = ROOT + "/assets/environments/"
OUT = ROOT + "/assets/props/atlantis/c/"
JS = ROOT + "/engine/page/props-at-c-plate-34.js"
BENCH = ROOT + "/storyboards/series/ancient-aliens/03-atlantis/block-c/bench/"
W, H, OW, OH = 1536, 1024, 2048, 1365
K = OW / W

# per plate: env; fills = things painted out of the clean layer (a polygon in plate pixels, grown by 5 px; side "left"/"right" = which
# neighbours the rows are filled from, mirrored back and forth); cards = the cut cards' pixels (a polygon, optionally colour-keyed:
# key "notsky" keeps what is not blue/white, "notwater" keeps what is not water), and they are painted out of the clean layer too.
# A run that touches the left frame edge is always filled from its right.
PLATES = {
    "34": dict(env="at-port-royal",
        fills=[
            dict(poly=[(0, 580), (168, 580), (168, 662), (250, 662), (250, 820), (320, 820), (320, 1024), (0, 1024)]),     # barrels and crates
            # the posts on the beam: above the beam's outer edge the water goes on; on the beam and the planks the picture is copied along the beam
            dict(poly=[(1018, 688), (1150, 688), (1154, 958), (1016, 958)], outer=((1025, 803), (1140, 853)), inner=((1020, 860), (1215, 985)), water="right", beam=(-145, -80), deck=(-145, -97)),
            dict(poly=[(1352, 796), (1536, 796), (1536, 1024), (1352, 1024)], outer=((1360, 958), (1536, 1040)), inner=((1215, 985), (1400, 1105)), water="left", beam=(-190, -88), deck=(-190, -123)),
            dict(poly=[(812, 624), (894, 624), (896, 740), (810, 740)], outer=((745, 652), (840, 718)), inner=((787, 685), (855, 745)), water="right", beam=(-95, -66), deck=(-95, -66)),
            dict(poly=[(652, 522), (700, 522), (704, 616), (650, 616)], side="right"), dict(poly=[(728, 530), (788, 530), (790, 668), (726, 668)], side="right"),
            dict(poly=[(828, 526), (874, 526), (876, 636), (826, 636)], side="right"),
        ],
        cards=[
            # the palm: the trunk (all of it) and the fronds (not the sky)
            dict(poly=[(408, 58), (405, 100), (397, 160), (383, 240), (364, 300), (355, 360), (345, 420), (333, 480), (322, 540), (318, 584), (360, 584), (353, 540), (358, 480), (368, 420), (375, 360), (385, 300), (402, 240), (413, 160), (423, 100), (428, 58)], side="right"),
            dict(poly=[(258, 28), (300, 12), (335, 0), (645, 0), (648, 70), (640, 100), (580, 146), (520, 152), (505, 180), (470, 200), (440, 200), (420, 170), (390, 155), (350, 165), (326, 178), (300, 125), (278, 80), (262, 42)], key="notsky", whole=True, side="right"),
            # the ships (coarse: they stand 130 and 290 m away)
            dict(poly=[(1138, 190), (1150, 192), (1152, 255), (1180, 262), (1215, 262), (1240, 268), (1245, 330), (1262, 345), (1265, 445), (1262, 485), (1240, 495), (1150, 497), (1090, 492), (1070, 470), (1068, 448), (1085, 440), (1092, 420), (1100, 345), (1100, 262), (1122, 258), (1138, 255)]),
            dict(poly=[(1262, 330), (1290, 150), (1285, 100), (1330, 70), (1400, 62), (1430, 70), (1536, 60), (1536, 482), (1285, 482), (1262, 430)]),
            # the jetty: rails and piles above the deck, the legs under the beam, the big piles through the deck
            dict(poly=[(868, 548), (1395, 548), (1395, 598), (868, 598)], key="notwater", whole=True, side="right"),
            dict(poly=[(868, 641), (1395, 641), (1395, 690), (868, 690)], key="notwater", whole=True, side="right"),
            dict(poly=[(868, 690), (1025, 690), (1025, 722), (868, 722)], key="notwater", whole=True, side="right"),
            dict(poly=[(1145, 690), (1395, 690), (1395, 722), (1145, 722)], key="notwater", whole=True, side="right"),
            *[dict(poly=[(a, 598), (b, 598), (b, 641), (a, 641)], key="notwater", whole=True) for a, b in [(948, 986), (1064, 1101), (1158, 1191), (1233, 1266), (1286, 1312), (1343, 1374), (868, 886)]],
        ]),
    "35": dict(env="at-port-royal-sink",
        fills=[dict(poly=[(0, 648), (96, 648), (100, 762), (0, 762)])],                                                  # the capstan
        cards=[
            # the piles and wrecked rails in the sea (colour-keyed: wood, not water or foam), a far zone and a near zone
            dict(poly=[(300, 540), (560, 525), (800, 520), (1000, 495), (1100, 470), (1130, 445), (1536, 445), (1536, 740), (945, 740), (945, 610), (770, 610), (770, 700), (560, 700), (540, 660), (520, 640), (440, 622), (330, 605), (300, 590)], key="wood", side="right"),
            dict(poly=[(770, 610), (945, 610), (945, 740), (1536, 740), (1536, 1024), (1210, 1024), (1075, 946), (950, 891), (830, 815), (770, 790)], key="wood", side="right"),
            # the ships (coarse: they stand 123 and 52 m away)
            dict(poly=[(1180, 185), (1195, 185), (1235, 95), (1300, 100), (1305, 180), (1340, 235), (1345, 300), (1315, 350), (1315, 400), (1260, 408), (1135, 400), (1125, 370), (1150, 350), (1165, 300), (1175, 235)]),
            dict(poly=[(1385, 160), (1420, 60), (1500, 0), (1536, 0), (1536, 436), (1380, 436), (1378, 350), (1385, 250)]),
        ]),
}


def poly_mask(polys, feather=0, grow=0):
    im = Image.new("L", (OW, OH), 0); d = ImageDraw.Draw(im)
    for p in polys: d.polygon([(x * K, y * K) for x, y in p], fill=255)
    if grow: im = im.filter(ImageFilter.MaxFilter(grow | 1))
    if feather: im = im.filter(ImageFilter.GaussianBlur(feather * K))
    return np.array(im)


def fill_runs(out, mask, side="left"):
    """paint the masked pixels out: every row's run of masked pixels takes the pixels beside it, mirrored back and forth"""
    for y in range(OH):
        row = mask[y] > 0
        if not row.any(): continue
        d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]])); starts = np.where(d == 1)[0]; ends = np.where(d == -1)[0]   # [a, b)
        for a, b in zip(starts, ends):
            n = b - a; L = min(max(24, n), 150)
            use = side
            if a <= 2 or (use == "left" and a - L < 0): use = "right"
            if use == "right" and b + L > OW: use = "left"
            i = np.arange(n); t = np.mod(i, 2 * L); t = np.where(t < L, t, 2 * L - 1 - t)
            src = (a - 1 - t) if use == "left" else (b + t)
            out[y, a:b] = out[y, np.clip(src, 0, OW - 1)]


def seam(out, mask):
    soft = np.array(Image.fromarray(out).filter(ImageFilter.GaussianBlur(1.3)))
    big = Image.fromarray(mask).filter(ImageFilter.MaxFilter(7)); small = Image.fromarray(mask).filter(ImageFilter.MinFilter(5))
    edge = (np.array(big) > 0) & ~(np.array(small) > 0)
    out[edge] = soft[edge]


def keyed(base, poly, test):
    """a colour-keyed card region: the polygon's pixels for which test holds"""
    m = poly_mask([poly]) > 0; r, g, b = [base[..., i].astype(np.float32) for i in (0, 1, 2)]   # base is RGB
    sky = ((b > r + 40) & (b > g - 8)) | ((r > 195) & (g > 200) & (b > 200))
    water = (b > r + 25) & (g > r + 10)
    foam = (np.minimum(np.minimum(r, g), b) > 150) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) < 70)
    wood = ~((b > r + 12) | foam)
    t = {"notwater": ~water, "notsky": ~sky, "wood": wood}[test]
    return (m & t).astype(np.uint8) * 255


def build(key, preview=None):
    D = PLATES[key]
    src = Image.open(ENV + D["env"] + "/paint.png").convert("RGB")
    base = np.array(src.resize((OW, OH), Image.LANCZOS))
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(base).save(OUT + f"c-p{key}.webp", quality=92, method=6)
    clean = base.copy(); card = np.zeros((OH, OW), np.uint8)
    jobs = []                                                # (mask to paint out, side)
    for c in D["cards"]:
        k = keyed(base, c["poly"], c["key"]) if c.get("key") else poly_mask([c["poly"]])
        # a hard edge with a half-pixel soft rim, so the cut card does not show the painting's halo
        card = np.maximum(card, k)
        jobs.append((poly_mask([c["poly"]], 0, 11) if c.get("whole") else np.array(Image.fromarray(k).filter(ImageFilter.MaxFilter(19))), c.get("side", "left")))
    allm = np.zeros((OH, OW), np.uint8)
    for f in D["fills"]:
        m = poly_mask([f["poly"]], 0, 11)
        if "outer" in f:                                     # banded: water above the outer line, beam between, deck below the inner line
            orig = clean.copy(); Y, X = np.mgrid[0:OH, 0:OW]; xp, yp = X / K, Y / K
            ln = lambda L: L[0][1] + (L[1][1] - L[0][1]) * (xp - L[0][0]) / (L[1][0] - L[0][0])
            yo, yi = ln(f["outer"]), ln(f["inner"])
            for band, sel in (("beam", (yp >= yo) & (yp < yi)), ("deck", yp >= yi)):
                mm = (m > 0) & sel; dx, dy = f[band]
                clean[mm] = orig[np.clip(Y[mm] + int(dy * K), 0, OH - 1), np.clip(X[mm] + int(dx * K), 0, OW - 1)]
            mw = ((m > 0) & (yp < yo)).astype(np.uint8) * 255
            fill_runs(clean, mw, f["water"])
        else:
            fill_runs(clean, m, f.get("side", "left"))
        allm |= m
    for m, side in jobs:
        fill_runs(clean, m, side); allm |= m
    if allm.any(): seam(clean, allm)
    Image.fromarray(clean).save(OUT + f"c-p{key}-clean.webp", quality=92, method=6)
    Image.fromarray(card).save(OUT + f"c-p{key}-mask.png", optimize=True)
    if preview:                                              # the cut pixels tinted red over the plate, and the clean layer beside it
        pv = base.copy(); pv[card > 0] = (0.4 * pv[card > 0] + 0.6 * np.array([255, 0, 0])).astype(np.uint8)
        Image.fromarray(np.vstack([pv, clean])).resize((OW // 2, OH)).save(preview)
    print("built", key, "fills", len(D["fills"]), "cards", len(D["cards"]))


def scenes():
    code = f"import('{JS}').then(m => console.log(JSON.stringify(m.SCENES_34)))"
    return json.loads(subprocess.check_output(["node", "-e", code]))


def cam_matrix(c):
    f, hy = c["f"], c["hy"]; cx = c.get("cx", W / 2); yaw = np.radians(c.get("yaw", 0)); px, py, pz = c["pos"]
    cy, sy = np.cos(yaw), np.sin(yaw)
    Rm = np.array([[cy, 0, -sy, 0], [0, 1, 0, 0], [sy, 0, cy, 0], [0, 0, 0, 1.0]])
    T = np.eye(4); T[:3, 3] = [-px, -py, -pz]
    Kc = np.array([[f, 0, -cx, 0], [0, -f, -hy, 0], [0, 0, 0, 1], [0, 0, -1, 0.0]])
    return Kc @ Rm @ T


def overlay(key, out):
    S = scenes()[key]; M = cam_matrix(S["cam"]); D = PLATES[key]
    img = Image.open(ENV + D["env"] + "/paint.png").convert("RGB"); d = ImageDraw.Draw(img)
    def proj(p):
        q = M @ np.array([p[0], p[1], p[2], 1.0]); return (q[0] / q[3], q[1] / q[3], q[3])
    def seg(a, b, col):
        A, B = proj(a), proj(b)
        if A[2] < 0.05 and B[2] < 0.05: return
        if A[2] < 0.05 or B[2] < 0.05:
            t = (0.05 - A[2]) / (B[2] - A[2]); mid = [a[i] + (b[i] - a[i]) * t for i in range(3)]
            if A[2] < 0.05: a = mid; A = proj(a)
            else: b = mid; B = proj(b)
        cl = lambda v: float(np.clip(v, -20000, 20000))
        d.line([(cl(A[0]), cl(A[1])), (cl(B[0]), cl(B[1]))], fill=col, width=1)
    cols = [(255, 255, 0), (255, 0, 255), (0, 255, 0), (255, 128, 0), (0, 128, 255), (255, 255, 255)]
    for i, pc in enumerate(S["pieces"]):
        t, lay, g = pc[0], pc[1], pc[2]; col = cols[i % len(cols)]
        if t in ("quad", "poly"):
            for k in range(len(g)): seg(g[k], g[(k + 1) % len(g)], col)
        elif t == "lathe":
            cx, cz = g[0], g[1]
            for r, y in g[2]:
                ring = [[cx + r * np.cos(a), y, cz + r * np.sin(a)] for a in np.linspace(0, 2 * np.pi, 17)]
                for k in range(16): seg(ring[k], ring[k + 1], col)
    img.save(out); print("overlay", out)


def vs(stills, key):
    J = json.load(open(BENCH + f"at-cplate-{key}-vs.json")); cw, ch = 960, 540
    def still(t): return Image.open(f"{stills}/{J['id']}-anime-pro-draft-t{t:g}.png").convert("RGB")
    def label(im, txt):
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 14 + 9 * len(txt), 24], fill=(0, 0, 0)); d.text((6, 6), txt, fill=(255, 255, 255)); return im
    rows = []
    src = Image.open(ENV + PLATES[key]["env"] + "/paint.png").convert("RGB")
    big = Image.new("RGB", (W * 3, H * 3)); big.paste(src, (W, H))
    big.paste(src.transpose(Image.FLIP_LEFT_RIGHT), (0, H)); big.paste(src.transpose(Image.FLIP_LEFT_RIGHT), (2 * W, H))
    big.paste(src.transpose(Image.FLIP_TOP_BOTTOM), (W, 0)); big.paste(src.transpose(Image.FLIP_TOP_BOTTOM), (W, 2 * H))
    for name, row, k, col, t in J["vs"]:
        x0, y0 = int(W + col - 768 * k), int(H + row - 432 * k)
        left = big.crop((x0, y0, x0 + int(1536 * k), y0 + int(864 * k))).resize((cw, ch), Image.LANCZOS)
        s = still(t).resize((cw, ch), Image.LANCZOS)
        rows.append(np.hstack([np.array(label(left, f"plate {key} (painting)")), np.array(label(s, f"{name} (3D bench still)"))]))
    mv = [np.array(label(still(t).resize((640, 360), Image.LANCZOS), lab[:70])) for name, t, lab in J["moved"]]
    if mv:
        while len(mv) % 3: mv.append(np.zeros((360, 640, 3), np.uint8))
        rows += [np.hstack(mv[i:i + 3]) for i in range(0, len(mv), 3)]
    out = BENCH + f"at-cplate-{key}-vs.png"; Image.fromarray(np.vstack(rows)).save(out); print("wrote", out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--overlay"]: overlay(a[1], a[2])
    elif a[:1] == ["--vs"]: vs(a[1], a[2] if len(a) > 2 else "34")
    else:
        pv = a[a.index("--preview") + 1] if "--preview" in a else None
        for k in ([a[1]] if a[:1] == ["--only"] else PLATES): build(k, pv)
