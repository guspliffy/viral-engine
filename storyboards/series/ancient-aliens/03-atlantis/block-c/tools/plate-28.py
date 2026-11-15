#!/usr/bin/env python3
"""Block C, plate 28 (Bimini road under water): the layers and the scene data of the painted 3D scene "28" (camera projection).

  python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-28.py            # build the layers AND write the scene data
  python3 .../plate-28.py --layers                       # only assets/props/atlantis/c/c-p28.webp, c-p28-clean.webp, c-p28-mask.png
  python3 .../plate-28.py --emit                         # only the scene data into engine/page/props-at-c-plate-28.js (SCENE-JSON block)
  python3 .../plate-28.py --overlay out.png              # the scene's 3D edges (and the card outlines) drawn over the plate
  python3 .../plate-28.py --vs <stills dir>              # painting | P | S | M | Z -> block-c/bench/at-cplate-28-vs.png (reads at-cplate-28-vs.json)

Source: assets/environments/at-bimini-road/paint.png (the approved plate 28, 1536 x 1024). Output 2048 x 1365:
  c-p28.webp        the plate itself (projected from the painter's camera onto the 3D pieces)
  c-p28-clean.webp  the plate with the cards painted out (the fish, the reef clumps, the weed), filled row by row from the clear
                    neighbours, for the surfaces behind them
  c-p28-mask.png    red 255 where a card stands (cut cards draw only there)
THE FIT (all numbers are in this file; the picture is a painting, not a photograph: the near blocks sit on a real camera, the far ones
get wider gaps than the true 3.65 m pitch, because the painter packed them in):
  painter's camera  pos (2.44, -2.93, 7.47) in SEA coordinates (sea level y 0, blocks' tops y -4.9, sand y -5.5), yaw 13.2 deg (turns
  left), pitch -7.4 deg (looks down), f 1700 plate px, principal point (768, 512). The road runs along -z. The road's vanishing point
  (1170, 290) and the near block's four corners are what it is fitted to; block 0 comes out 3.7 m wide and 3.3 deep, at x -1.8..1.9, z -1.6..1.7.
Deterministic: no random numbers.
"""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
SRC = ROOT + "/assets/environments/at-bimini-road/paint.png"
OUT = ROOT + "/assets/props/atlantis/c/"
JS = ROOT + "/engine/page/props-at-c-plate-28.js"
BENCH = ROOT + "/storyboards/series/ancient-aliens/03-atlantis/block-c/bench/"
W, H, OW, OH = 1536, 1024, 2048, 1365
K = OW / W
DEG = np.pi / 180

# ------------------------------------------------------------------ the painter's camera (sea coordinates)
CAM = dict(pos=[2.44, -2.93, 7.47], yaw=13.2, pitch=-7.4, f=1700, hy=512)
TOP, SAND, SEA, BOT = -4.9, -5.5, 0.0, -5.9      # block tops, sand floor, sea level, the blocks' sunk bottoms
Z_FAR = -80                                       # the far water quad stands here; sand and ceiling run to it


def basis(c=CAM):
    y, p = c["yaw"] * DEG, -c["pitch"] * DEG            # p > 0 = looks down
    fw = np.array([-np.sin(y) * np.cos(p), -np.sin(p), -np.cos(y) * np.cos(p)])
    rt = np.array([np.cos(y), 0, -np.sin(y)])
    return rt, np.cross(rt, fw), fw


RT, UP, FW = basis()
POS = np.array(CAM["pos"], float)


def ray(u, v):
    return POS, FW + RT * (u - W / 2) / CAM["f"] - UP * (v - CAM["hy"]) / CAM["f"]


def on_y(u, v, y):
    o, d = ray(u, v); return o + d * ((y - o[1]) / d[1])


def on_z(u, v, z):
    o, d = ray(u, v); return o + d * ((z - o[2]) / d[2])


def at_depth(u, v, dist):
    """the point on the ray through (u, v) whose depth along the view axis is dist"""
    o, d = ray(u, v); return o + d * (dist / (d @ FW))


def r2(p): return [round(float(x), 2) for x in p]


# ------------------------------------------------------------------ the blocks (plate px of the top face's edges, measured on the painting)
# block 0: the four corners of its top face. Blocks 1-5: back edge row + right edge column, front edge row (block 1's front is hidden behind block 0).
T0 = dict(FL=(30, 805), FR=(1005, 835), BR=(1052, 678), BL=(415, 620))
BLOCKS = [  # (back row, back-left col, back-right col, front row, front-left col, front-right col); block 1's front is hidden behind block 0
    (522, 708, 1113, None, None, None),
    (447, 852, 1155, 495, 752, 1150),
    (396, 925, 1170, 422, 885, 1173),
    (362, 992, 1175, 376, 962, 1176),
    (343, 1032, 1178, 353, 1012, 1178),
]


def block_tops():
    """top face corners [FL, FR, BR, BL] in sea coordinates, nearest first"""
    t = [[on_y(*T0[k], TOP) for k in ("FL", "FR", "BR", "BL")]]
    zb = min(t[0][2][2], t[0][3][2])
    for rb, lb, xb, rf, lf, xf in BLOCKS:
        br = on_y(xb, rb, TOP); bl = on_y(lb, rb, TOP)
        if rf is None: fr = np.array([br[0], TOP, zb - 0.3]); fl = np.array([bl[0], TOP, zb - 0.3])
        else: fr = on_y(xf, rf, TOP); fl = on_y(lf, rf, TOP)
        t.append([fl, fr, br, bl]); zb = min(br[2], bl[2])
    return t


# ------------------------------------------------------------------ the cards (upright cut-outs: fish, reef clumps, weed)
# name, outline in plate px, kind, how the depth is fixed (foot = the (col, row) of its base on the sand; d = metres from the camera), colour mask
FISH_LEN = 0.30
FISH = [  # outline, length in px (-> distance)
    ("f1", [(128, 282), (148, 290), (153, 274), (177, 270), (200, 273), (216, 282), (228, 298), (217, 310), (197, 317), (187, 321), (167, 315), (150, 300), (130, 309), (138, 296)], 100),
    ("f2", [(810, 319), (820, 310), (830, 302), (842, 298), (855, 300), (863, 301), (867, 304), (878, 305), (868, 314), (877, 325), (867, 322), (862, 329), (845, 331), (843, 336), (833, 332), (820, 326)], 68),
    ("f3", [(1427, 220), (1436, 208), (1447, 200), (1465, 199), (1473, 203), (1480, 200), (1481, 206), (1474, 212), (1478, 219), (1470, 217), (1466, 220), (1460, 222), (1450, 226), (1445, 229), (1438, 226), (1430, 224)], 54),
    ("f4", [(1470, 393), (1480, 385), (1490, 376), (1502, 370), (1515, 372), (1520, 378), (1527, 383), (1536, 385), (1536, 398), (1527, 398), (1525, 404), (1516, 401), (1508, 408), (1500, 408), (1494, 403), (1482, 402), (1472, 398)], 66),
    ("f5", [(1311, 487), (1320, 474), (1335, 465), (1355, 460), (1385, 465), (1397, 472), (1410, 478), (1420, 483), (1408, 490), (1414, 512), (1395, 503), (1370, 507), (1353, 517), (1345, 509), (1325, 502), (1315, 497)], 110),
    ("f6", [(40, 512), (62, 520), (72, 503), (87, 494), (110, 492), (135, 500), (155, 493), (148, 508), (150, 520), (135, 538), (112, 548), (92, 545), (68, 546), (44, 542), (55, 528)], 115),
    ("f7", [(177, 533), (196, 541), (202, 527), (227, 525), (245, 533), (258, 548), (242, 558), (222, 563), (206, 562), (196, 556), (178, 553), (188, 545)], 80),
    ("f8", [(1373, 798), (1385, 780), (1400, 771), (1425, 767), (1455, 770), (1488, 782), (1490, 793), (1513, 797), (1500, 812), (1490, 823), (1463, 826), (1447, 830), (1430, 843), (1413, 835), (1395, 822), (1380, 812)], 140),
]
REEF = [  # name, outline, foot (col, row), colour mask (None | "fan" | "weed")
    ("reefLa", [(0, 228), (30, 232), (60, 232), (80, 240), (97, 262), (98, 282), (108, 300), (60, 311), (0, 316)], (50, 330), None),
    ("reefL", [(0, 316), (60, 311), (108, 306), (130, 312), (137, 330), (160, 326), (200, 328), (235, 340), (244, 360), (244, 385), (244, 420), (244, 455), (232, 468), (200, 470), (150, 472), (110, 470), (80, 465), (40, 462), (0, 470)], (125, 468), None),
    ("fan", [(298, 345), (320, 300), (345, 278), (380, 275), (395, 300), (415, 285), (445, 277), (465, 300), (468, 330), (450, 350), (420, 380), (400, 400), (385, 415), (363, 433), (345, 430), (340, 405), (320, 385)], (352, 432), "fan"),
    ("pink", [(250, 415), (262, 400), (285, 395), (310, 405), (322, 415), (334, 420), (334, 440), (322, 455), (300, 470), (265, 475), (250, 465)], (300, 472), None),
    ("rockM", [(367, 520), (375, 495), (400, 480), (430, 473), (460, 480), (477, 495), (490, 490), (500, 470), (513, 455), (513, 505), (500, 520), (480, 535), (450, 538), (410, 540), (375, 538)], (440, 538), None),
    ("weedA", [(263, 640), (268, 610), (285, 590), (300, 600), (315, 590), (335, 570), (352, 567), (372, 585), (375, 572), (385, 585), (402, 595), (407, 610), (395, 625), (380, 640), (350, 650), (320, 660), (290, 665), (262, 665)], (320, 655), "weed"),
    ("reefLo", [(0, 590), (12, 560), (45, 555), (75, 565), (85, 585), (95, 610), (130, 598), (160, 598), (183, 610), (180, 630), (170, 650), (165, 672), (150, 690), (110, 692), (80, 680), (40, 675), (0, 672)], (90, 690), None),
    ("weedB", [(650, 515), (660, 490), (680, 470), (700, 445), (725, 425), (745, 410), (770, 420), (795, 435), (790, 455), (770, 470), (750, 500), (730, 515), (700, 520)], (700, 520), "weed"),
    ("weedC", [(558, 562), (575, 530), (595, 510), (610, 500), (628, 520), (625, 545), (605, 560), (580, 566)], (590, 563), "weed"),
    ("weedD", [(850, 435), (865, 400), (885, 385), (905, 380), (912, 400), (895, 425), (880, 440)], (880, 440), "weed"),
    ("reefR1", [(1247, 425), (1262, 405), (1290, 395), (1330, 390), (1360, 398), (1377, 420), (1370, 440), (1340, 447), (1300, 447), (1260, 445)], (1310, 446), None),
    ("rockR", [(1223, 570), (1240, 553), (1275, 545), (1285, 530), (1320, 525), (1355, 532), (1372, 555), (1385, 580), (1375, 598), (1340, 600), (1300, 602), (1260, 600), (1228, 590)], (1300, 600), None),
    ("coralR", [(1280, 700), (1285, 690), (1295, 670), (1320, 665), (1345, 672), (1365, 650), (1380, 625), (1385, 600), (1415, 578), (1440, 580), (1470, 585), (1475, 560), (1480, 540), (1505, 525), (1520, 550), (1536, 545), (1536, 745), (1510, 750), (1480, 745), (1440, 740), (1420, 725), (1390, 725), (1360, 722), (1330, 725), (1295, 728), (1280, 715)], (1410, 745), None),
    ("oliveR", [(1470, 455), (1480, 440), (1500, 430), (1520, 432), (1536, 440), (1536, 462), (1510, 467), (1480, 466)], (1505, 466), None),
    ("oliveR2", [(1445, 525), (1455, 515), (1480, 510), (1495, 515), (1490, 530), (1470, 545), (1450, 545)], (1470, 545), None),
]


GROW = {"fish": 2, "reef": 3, "reefLa": 0, "reefL": -1}


def hull(pts):
    p = sorted(set(map(tuple, pts)))
    def half(seq):
        h = []
        for q in seq:
            while len(h) >= 2 and (h[-1][0] - h[-2][0]) * (q[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (q[0] - h[-2][0]) <= 0: h.pop()
            h.append(q)
        return h[:-1]
    return half(p) + half(p[::-1])


def grow(pts, g):
    """the outline pushed g px away from its centre (a little slack for the card's quad)"""
    c = np.mean(pts, axis=0); out = []
    for q in pts:
        d = np.array(q, float) - c; n = np.linalg.norm(d) or 1; out.append((q[0] + d[0] / n * g, q[1] + d[1] / n * g))
    return out


def edge_ext(poly):
    """a card that touches the plate's edge carries on past it (the mask and texture mirror there): its outline is pushed 70 px out"""
    out = []
    for x, y in poly:
        out.append((x - 70 if x <= 1 else (x + 70 if x >= W - 1 else x), y))
    return out


def cards():
    """[(name, group, outline, hull in plate px, plane z, colour mask)]"""
    out = []
    for name, poly, px in FISH:
        cx, cy = np.mean(poly, axis=0); dist = FISH_LEN * CAM["f"] / px
        zc = at_depth(cx, cy, dist)[2]
        out.append((name, "fish", poly, zc, None, "dist"))
    for name, poly, foot, colour in REEF:
        zc = on_y(foot[0], foot[1], SAND)[2]
        out.append((name, "reef", poly, zc, colour, "foot"))
    return out


# ------------------------------------------------------------------ the pieces
def pieces():
    P = []
    q = lambda layer, pts, o=None: P.append(["quad", layer, [r2(p) for p in pts]] + ([o] if o else []))
    # the sand floor, the surface seen from below, the far water behind everything
    q("clean", [[-300, SAND, Z_FAR], [300, SAND, Z_FAR], [300, SAND, 14], [-300, SAND, 14]])
    q("clean", [[-300, SEA, 14], [300, SEA, 14], [300, SEA, Z_FAR], [-300, SEA, Z_FAR]])
    q("clean", [[-300, -12, Z_FAR], [300, -12, Z_FAR], [300, SEA, Z_FAR], [-300, SEA, Z_FAR]])
    # the road blocks: top, front, right, left, back; the bottoms sunk below the sand
    for fl, fr, br, bl in block_tops():
        dn = lambda p, y: [p[0], y, p[2]]
        q("clean", [fl, fr, br, bl])
        q("clean", [dn(fl, BOT), dn(fr, BOT), fr, fl])
        q("clean", [dn(fr, BOT), dn(br, BOT), br, fr])
        q("clean", [dn(bl, BOT), dn(fl, BOT), fl, bl])
        q("clean", [dn(br, BOT), dn(bl, BOT), bl, br])
    # the cards
    for name, grp, poly, zc, colour, how in cards():
        h = hull(grow(edge_ext(poly), GROW.get(name, GROW[grp])))
        P.append(["poly", "cut", [r2(on_z(u, v, zc)) for u, v in h], {"g": grp}])
    return P


def scene():
    t = block_tops()[0]
    x0 = max(t[0][0], t[3][0]) + 0.1; x1 = min(t[1][0], t[2][0]) - 0.1
    z0 = max(t[2][2], t[3][2]) + 0.1; z1 = min(t[0][2], t[1][2]) - 0.1
    return {"file": "c-p28", "clean": True, "mask": True, "size": [W, H],
            "cam": {"pos": CAM["pos"], "yaw": CAM["yaw"], "pitch": CAM["pitch"], "f": CAM["f"], "hy": CAM["hy"]},
            "pieces": pieces(),
            "tops": [[round(float(x0), 2), round(float(z0), 2), round(float(x1), 2), round(float(z1), 2), TOP]],
            "meta": {"spud": [0.0, 0.0], "topY": TOP, "propY": 4.9}}


def emit():
    S = scene(); lines = []
    lines.append("{")
    for k in ("file", "clean", "mask", "size", "cam"): lines.append(f'  "{k}": {json.dumps(S[k])},')
    lines.append('  "pieces": [')
    lines += ["    " + json.dumps(p) + ("," if i < len(S["pieces"]) - 1 else "") for i, p in enumerate(S["pieces"])]
    lines.append("  ],")
    lines.append(f'  "tops": {json.dumps(S["tops"])},')
    lines.append(f'  "meta": {json.dumps(S["meta"])}')
    lines.append("}")
    src = open(JS).read()
    new = "/*SCENE-JSON-BEGIN*/\nconst SCENE_28 = " + "\n".join(lines) + ";\n/*SCENE-JSON-END*/"
    src2, n = re.subn(r"/\*SCENE-JSON-BEGIN\*/.*?/\*SCENE-JSON-END\*/", lambda m: new, src, flags=re.S)
    if n != 1: raise SystemExit("props-at-c-plate-28.js has no SCENE-JSON block (write the module first)")
    open(JS, "w").write(src2); print("wrote scene data", JS, len(S["pieces"]), "pieces")


# ------------------------------------------------------------------ the layers
def poly_mask(polys, grow_px=0):
    m = Image.new("L", (OW, OH), 0); d = ImageDraw.Draw(m)
    for p in polys: d.polygon([(x * K, y * K) for x, y in p], fill=255)
    if grow_px: m = m.filter(ImageFilter.MaxFilter(grow_px * 2 + 1))
    return np.array(m) > 0


def colour_mask(rgb, kind):
    R, G, B = rgb[..., 0].astype(float), rgb[..., 1].astype(float), rgb[..., 2].astype(float)
    if kind == "fan": return (R > 0.62 * G) | (R > 90)
    if kind == "weed": return (B < 0.62 * G) & (R > 70)
    if kind == "auto": return ~((B >= 0.9 * G) & (R < 0.85 * B))      # everything that is not cyan water or sand
    return np.ones(R.shape, bool)


def dilate(m, n):
    return np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n * 2 + 1))) > 0


def erode(m, n):
    return np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(n * 2 + 1))) > 0


def card_masks(rgb):
    """{name: boolean mask at 2048 x 1365}"""
    out = {}
    for name, grp, poly, zc, colour, how in cards():
        m = poly_mask([poly], 2)
        if colour: m &= dilate(colour_mask(rgb, colour), 2); m = erode(dilate(m, 3), 1) | (m & dilate(colour_mask(rgb, colour), 1))
        elif grp == "fish": m = poly_mask([poly], 3)
        else:
            m = poly_mask([poly], 3) & erode(dilate(colour_mask(rgb, "auto"), 3), 2)
        out[name] = m
    return out


def row_fill(img, mask):
    """paint the masked pixels out: each run of a row is read back from the clear neighbours of that row (mirrored)"""
    out = img.copy()
    for y in range(mask.shape[0]):
        r = mask[y]
        if not r.any(): continue
        clear = np.where(~r)[0]
        if len(clear) == 0: continue
        xs = np.where(r)[0]; runs = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
        for run in runs:
            a, b = run[0], run[-1] + 1; L = b - a
            left = clear[clear < a][::-1]; right = clear[clear >= b]
            nb = min(max(L, 8), 90)                   # read back from the nearest clear pixels only (never from far features)
            seq = right[:nb] if (len(right) and (len(left) == 0 or (OW - b) <= a)) else left[:nb]
            if len(seq) < 8: seq = np.concatenate([right[:nb], left[:nb]])
            if len(seq) == 0: seq = clear
            n = len(seq); idx = np.arange(L) % (2 * n); idx = np.where(idx < n, idx, 2 * n - 1 - idx)
            out[y, a:b] = img[y, seq[idx]]
    return out


def fill_both(img, mask):
    """row fill and column fill averaged (no horizontal repeats), then a little blur inside the hole"""
    a = row_fill(img, mask).astype(float)
    b = np.transpose(row_fill(np.transpose(img, (1, 0, 2)), mask.T), (1, 0, 2)).astype(float)
    out = (a + b) / 2
    soft = np.array(Image.fromarray(out.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))).astype(float)
    out[mask] = soft[mask]
    return out.astype(np.uint8)


def build_layers():
    os.makedirs(OUT, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    base = np.array(src.resize((OW, OH), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.4, 55, 2)))
    Image.fromarray(base).save(OUT + "c-p28.webp", quality=92, method=6)
    ms = card_masks(base); allm = np.zeros((OH, OW), bool)
    for m in ms.values(): allm |= m
    fillm = dilate(allm, 3)
    clean = fill_both(base, fillm)
    edge = dilate(fillm, 2) & ~erode(fillm, 2)
    soft = np.array(Image.fromarray(clean).filter(ImageFilter.GaussianBlur(1.3)))
    clean[edge] = soft[edge]
    Image.fromarray(clean).save(OUT + "c-p28-clean.webp", quality=92, method=6)
    Image.fromarray((allm * 255).astype(np.uint8)).save(OUT + "c-p28-mask.png", optimize=True)
    # overlap check: a card's quad must not cover another card's pixels (the shared mask would draw them twice)
    names = list(ms); bad = []
    for n, (name, grp, poly, zc, colour, how) in zip(range(len(names)), cards()):
        box = poly_mask([hull(grow(edge_ext(poly), GROW.get(name, GROW[grp])))])
        for other in names:
            if other != name and (box & ms[other]).sum() > 40: bad.append((name, other, int((box & ms[other]).sum())))
    print("built layers; cards:", len(names), "overlaps (card box over another card's pixels):", bad or "none")


# ------------------------------------------------------------------ overlay and vs sheet
def load_scene():
    s = open(JS).read()
    m = re.search(r"/\*SCENE-JSON-BEGIN\*/\s*const SCENE_28 = (.*?);\s*/\*SCENE-JSON-END\*/", s, re.S)
    return json.loads(m.group(1))


def project(p):
    v = np.array(p, float) - POS; d = v @ FW
    return (W / 2 + CAM["f"] * (v @ RT) / d, CAM["hy"] - CAM["f"] * (v @ UP) / d, d)


def overlay(out):
    S = load_scene(); img = Image.open(SRC).convert("RGB"); dr = ImageDraw.Draw(img)
    cols = [(0, 255, 255), (255, 0, 255), (0, 255, 0), (255, 128, 0), (255, 255, 0), (255, 80, 80)]

    def seg(a, b, col):
        A, B = project(a), project(b)
        if A[2] < 0.05 and B[2] < 0.05: return
        a, b = np.array(a, float), np.array(b, float)
        if A[2] < 0.05 or B[2] < 0.05:
            t = (0.05 - A[2]) / (B[2] - A[2]); mid = a + (b - a) * t
            if A[2] < 0.05: a = mid; A = project(a)
            else: b = mid; B = project(b)
        cl = lambda x: float(np.clip(x, -20000, 20000))
        dr.line([(cl(A[0]), cl(A[1])), (cl(B[0]), cl(B[1]))], fill=col, width=1)
    for i, pc in enumerate(S["pieces"]):
        t, lay, g = pc[0], pc[1], pc[2]; col = cols[i % len(cols)] if lay != "cut" else (255, 255, 255)
        if lay == "clean" and i < 3: col = (0, 120, 255)
        for k in range(len(g)): seg(g[k], g[(k + 1) % len(g)], col)
    for x0, z0, x1, z1, y in S["tops"]:
        q = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]
        for k in range(4): seg(q[k], q[(k + 1) % 4], (255, 0, 0))
    img.save(out); print("overlay", out)


def vs(stills):
    J = json.load(open(BENCH + "at-cplate-28-vs.json")); cw, ch = 960, 540
    plate = Image.open(SRC).convert("RGB")
    big = Image.new("RGB", (W * 3, H * 3))
    for ix in range(3):
        for iy in range(3):
            t = plate
            if ix % 2 == 0: t = t.transpose(Image.FLIP_LEFT_RIGHT)
            if iy % 2 == 0: t = t.transpose(Image.FLIP_TOP_BOTTOM)
            big.paste(t, (ix * W, iy * H))

    def window(col, row, k):
        x0, y0 = W + col - 768 * k, H + row - 432 * k
        return big.crop((int(x0), int(y0), int(x0 + 1536 * k), int(y0 + 864 * k))).resize((cw, ch), Image.LANCZOS)

    def label(im, txt):
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 14 + 9 * len(txt), 26], fill=(0, 0, 0)); d.text((8, 7), txt, fill=(255, 255, 255)); return im
    def still(t):
        for pat in (f"{J['id']}-anime-pro-draft-t{t:g}.png",):
            p = f"{stills}/{pat}"
            if os.path.exists(p): return Image.open(p).convert("RGB").resize((cw, ch), Image.LANCZOS)
        print("missing still", t); return Image.new("RGB", (cw, ch))
    tiles = [label(window(*J["window"]["P"]), "plate 28 (painting)")]
    for name, t, txt in J["shots"]: tiles.append(label(still(t), f"{name} {txt}"[:70]))
    tiles.append(label(window(*J["window"]["Z"]), "plate 28 (painting, the Z window)"))
    rows = [np.hstack([np.array(a), np.array(b)]) for a, b in zip(tiles[0::2], tiles[1::2] + [Image.new("RGB", (cw, ch))])]
    out = BENCH + "at-cplate-28-vs.png"; Image.fromarray(np.vstack(rows)).save(out); print("wrote", out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--overlay"]: overlay(a[1])
    elif a[:1] == ["--vs"]: vs(a[1])
    elif a[:1] == ["--emit"]: emit()
    elif a[:1] == ["--layers"]: build_layers()
    else: build_layers(); emit()
