#!/usr/bin/env python3
"""Atlantis near city, round R1: the texture layers of the painted 3D scenes in engine/page/props-at-city.js (spec.plate).

  python3 storyboards/series/ancient-aliens/03-atlantis/kit/tools/city-plates.py            # build every layer
  python3 .../city-plates.py --only 01                                                     # one plate
  python3 .../city-plates.py --overlay 01 out.png                                          # the scene's 3D edges drawn over the plate
  python3 .../city-plates.py --vs out/at-city [at-city]                                    # painting | bench still, side by side
                                                                                           # -> kit/bench/<id>-vs.png (reads <id>-vs.json)

Source: assets/environments/<env>/paint-hi.png (the approved plate, 3072 x 2048). Output, 2048 x 1365 WebP, in
assets/props/atlantis/:
  city-pNN.webp        the plate itself (projected from the plate camera onto the 3D pieces)
  city-pNN-clean.webp  the plate with the near things painted out (bollards, rope, ships: what a real 3D piece or a
                       card now carries), filled row by row from the neighbours, for the surfaces behind them
  city-pNN-mask.png    grey: the things that stand as upright cards (255, hard edge) and their reflections as water
                       decals (soft, at most 120); the colour comes from city-pNN.webp at the same place
All coordinates below are plate pixels (1536 x 1024). Deterministic: no random numbers.
"""
import json, re, sys, os
import numpy as np, cv2

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
ENV = ROOT + "/assets/environments/"
OUT = ROOT + "/assets/props/atlantis/"
JS = ROOT + "/engine/page/props-at-city.js"
W, H, OW, OH = 1536, 1024, 2048, 1365

# per plate: env; fills = (polygon, source columns): the polygon is painted out of the clean layer, every row of it tiled (back and
# forth) from that row's pixels in the source columns, which must be clear of the thing itself; cuts = (the outline of a thing that
# stands as a card, [(row0, row1, source columns), ...] for the hole it leaves); decals = (polygon, feather px, source columns)
PLATES = {
    "01": dict(env="at-harbour-dawn",
        fills=[([(0, 842), (60, 838), (122, 800), (122, 752), (185, 733), (300, 738), (335, 800), (420, 846), (455, 900), (445, 962), (320, 1004), (0, 1010)], (460, 900)),
               ([(1332, 692), (1344, 672), (1500, 672), (1500, 640), (1536, 640), (1536, 930), (1296, 934), (1282, 800), (1332, 786)], (900, 1280))],
        cuts=[([(340, 456), (364, 456), (370, 500), (388, 505), (383, 411), (447, 403), (447, 369), (461, 369), (463, 401), (533, 397), (535, 413), (523, 506), (562, 520), (598, 572), (598, 592), (480, 604), (340, 602), (320, 594), (335, 560), (339, 520)],
               [(0, 450, (288, 380)), (450, 520, (286, 332)), (520, 1024, (606, 760))]),
              ([(1185, 498), (1218, 505), (1211, 415), (1267, 407), (1267, 391), (1279, 391), (1281, 405), (1343, 401), (1335, 498), (1352, 468), (1373, 464), (1376, 500), (1368, 550), (1350, 564), (1250, 568), (1163, 558), (1166, 542), (1189, 530)],
               [(0, 494, (1168, 1208)), (494, 522, (1168, 1182)), (522, 1024, (1000, 1158))])],
        decals=[([(318, 596), (600, 590), (610, 640), (560, 692), (360, 692), (310, 640)], 14, (614, 800)), ([(1170, 556), (1372, 552), (1380, 600), (1340, 640), (1200, 640), (1165, 600)], 12, (1000, 1158))]),
    "02": dict(env="at-citadel-wall-dawn", fills=[], cuts=[], decals=[]),
    "04": dict(env="at-harbour-wall-past", fills=[],
        cuts=[([(920, 528), (940, 530), (948, 560), (985, 552), (972, 456), (1028, 448), (1028, 414), (1040, 414), (1042, 446), (1090, 442), (1086, 548), (1140, 560), (1150, 532), (1168, 534), (1170, 600), (1160, 624), (940, 626), (895, 616), (910, 600), (925, 575)],
               [(0, 1024, (690, 890))]),
              ([(1281, 498), (1300, 502), (1322, 505), (1316, 440), (1356, 434), (1356, 408), (1368, 408), (1370, 432), (1408, 428), (1404, 502), (1440, 510), (1448, 494), (1458, 496), (1458, 540), (1448, 560), (1300, 560), (1272, 550), (1284, 530)],
               [(0, 506, (1256, 1310)), (506, 1024, (1180, 1270))]),
              ([(100, 600), (118, 586), (150, 586), (170, 600), (172, 625), (200, 620), (224, 632), (228, 655), (250, 650), (262, 640), (290, 630), (322, 640), (336, 668), (332, 705), (250, 712), (222, 704), (170, 698), (128, 684), (100, 650)],
               [(0, 1024, (8, 96))])],
        decals=[([(905, 620), (1170, 620), (1175, 660), (1140, 720), (940, 720), (900, 660)], 14, (690, 890)), ([(1285, 558), (1458, 558), (1462, 590), (1440, 640), (1300, 640), (1280, 590)], 12, (1180, 1270))]),
    "11": dict(env="at-walls-view", fills=[], cuts=[], decals=[]),
    "08": dict(env="at-canal-cutaway", fills=[],
        cuts=[([(652, 158), (680, 158), (690, 200), (730, 205), (716, 98), (808, 84), (808, 40), (822, 40), (824, 80), (924, 64), (908, 192), (940, 186), (958, 190), (952, 250), (945, 276), (650, 276), (638, 262), (655, 230), (660, 200)],
               [(0, 1024, (548, 634))])], decals=[]),
    "09": dict(env="at-canal-suez", fills=[],
        cuts=[([(296, 182), (318, 184), (326, 214), (352, 214), (340, 126), (408, 116), (408, 78), (420, 78), (422, 112), (492, 104), (474, 208), (505, 212), (512, 196), (528, 198), (524, 250), (512, 274), (300, 274), (276, 266), (292, 240), (300, 214)],
               [(0, 1024, (176, 270))]),
              ([(1066, 202), (1090, 196), (1096, 150), (1108, 150), (1112, 196), (1126, 196), (1128, 146), (1228, 150), (1232, 132), (1262, 128), (1270, 84), (1290, 84), (1296, 126), (1332, 134), (1334, 196), (1346, 200), (1346, 294), (1104, 296), (1082, 262), (1068, 220)],
               [(0, 262, (1352, 1440)), (262, 1024, (962, 1060))])],
        decals=[([(285, 272), (528, 272), (535, 300), (280, 300)], 6, (150, 270))]),
}
K = OW / W   # plate pixel -> layer pixel

def poly_mask(polys, feather=0, grow=0):
    m = np.zeros((OH, OW), np.uint8)
    for p in polys: cv2.fillPoly(m, [np.round(np.array(p) * K).astype(np.int32)], 255)
    if grow: m = cv2.dilate(m, np.ones((grow, grow), np.uint8))
    if feather: m = cv2.GaussianBlur(m, (0, 0), feather * K)
    return m

def tile_fill(out, mask, src, rows=(0, H)):
    """Paint the masked pixels of the rows out: each row takes its own pixels from the source columns, tiled back and forth."""
    x0, x1 = int(src[0] * K), int(src[1] * K); L = x1 - x0; xs = np.arange(OW); ph = np.mod(xs - x0, 2 * L); idx = x0 + np.where(ph < L, ph, 2 * L - 1 - ph)
    for y in range(int(rows[0] * K), min(OH, int(rows[1] * K))):
        r = mask[y] > 0
        if r.any(): out[y, r] = out[y, idx[r]]

def seam(out, mask):
    soft = cv2.GaussianBlur(out, (0, 0), 1.3); edge = cv2.dilate(mask, np.ones((7, 7), np.uint8)) - cv2.erode(mask, np.ones((5, 5), np.uint8))
    out[edge > 0] = soft[edge > 0]

def build(key):
    D = PLATES[key]
    hi = cv2.imread(ENV + D["env"] + "/paint-hi.png")
    base = cv2.resize(hi, (OW, OH), interpolation=cv2.INTER_AREA)
    os.makedirs(OUT, exist_ok=True)
    cv2.imwrite(OUT + f"city-p{key}.webp", base, [cv2.IMWRITE_WEBP_QUALITY, 92])
    clean = base.copy(); allm = np.zeros((OH, OW), np.uint8); card = np.zeros((OH, OW), np.uint8); soft = np.zeros((OH, OW), np.uint8)
    for p, f, src in D["decals"]:
        m = poly_mask([p], 0, 5); tile_fill(clean, m, src); allm |= m
        soft = np.maximum(soft, (poly_mask([p], f).astype(np.float32) * 0.47).astype(np.uint8))
    for p, parts in D["cuts"]:
        m = poly_mask([p], 0, 11); card |= poly_mask([p], 0.5)
        for r0, r1, src in parts: tile_fill(clean, m, src, (r0, r1))
        allm |= m
    for p, src in D["fills"]:
        m = poly_mask([p]); tile_fill(clean, m, src); allm |= m
    if allm.any():
        seam(clean, allm)
        cv2.imwrite(OUT + f"city-p{key}-clean.webp", clean, [cv2.IMWRITE_WEBP_QUALITY, 92])
    if card.any() or soft.any():
        a = np.where(card > 110, 255, 0).astype(np.uint8); soft[a > 0] = 0
        cv2.imwrite(OUT + f"city-p{key}-mask.png", np.maximum(a, soft), [cv2.IMWRITE_PNG_COMPRESSION, 9])   # decals stay under the cards' alpha test (0.5)
    print("built", key, "fills", len(D["fills"]), "cuts", len(D["cuts"]), "decals", len(D["decals"]))

# ---- overlay: the scene pieces of props-at-city.js projected with the plate camera and drawn over the plate
def scenes():
    src = open(JS).read()
    m = re.search(r"/\*PLATES-JSON-BEGIN\*/\s*const PLATE_SCENES = (.*?);\s*/\*PLATES-JSON-END\*/", src, re.S)
    return json.loads(m.group(1))

def cam_matrix(c):
    f, hy = c["f"], c["hy"]; cx = c.get("cx", W / 2); yaw = np.radians(c.get("yaw", 0)); px, py, pz = c["pos"]
    cy, sy = np.cos(yaw), np.sin(yaw)
    Rm = np.array([[cy, 0, -sy, 0], [0, 1, 0, 0], [sy, 0, cy, 0], [0, 0, 0, 1.0]])    # world -> camera (yaw about +y, positive turns the view left)
    T = np.eye(4); T[:3, 3] = [-px, -py, -pz]
    K = np.array([[f, 0, -cx, 0], [0, -f, -hy, 0], [0, 0, 0, 1], [0, 0, -1, 0.0]])    # -> (u w, v w, _, w), w = depth
    return K @ Rm @ T

def box_pts(b, o):
    x0, y0, z0, x1, y1, z1 = b; tx = o.get("tx", 0); tz = o.get("tz", 0); tx0 = o.get("tx0", tx); tx1 = o.get("tx1", tx); tz0 = o.get("tz0", tz); tz1 = o.get("tz1", tz)
    return [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0 + tx0, y1, z0 + tz0], [x1 - tx1, y1, z0 + tz0], [x1 - tx1, y1, z1 - tz1], [x0 + tx0, y1, z1 - tz1]]

def overlay(key, out):
    S = scenes()[key]; M = cam_matrix(S["cam"]); D = PLATES[key]
    img = cv2.resize(cv2.imread(ENV + D["env"] + "/paint-hi.png"), (W, H), interpolation=cv2.INTER_AREA)
    for p, *_ in D["fills"] + D["cuts"] + D["decals"]: cv2.polylines(img, [np.array(p, np.int32)], True, (0, 0, 255), 1, cv2.LINE_AA)
    def proj(p):
        q = M @ np.array([p[0], p[1], p[2], 1.0]); return (q[0] / q[3], q[1] / q[3], q[3])
    def seg(a, b, col):
        A, B = proj(a), proj(b)
        if A[2] < 0.05 and B[2] < 0.05: return
        if A[2] < 0.05 or B[2] < 0.05:                      # clip at the near plane
            t = (0.05 - A[2]) / (B[2] - A[2]); mid = [a[i] + (b[i] - a[i]) * t for i in range(3)]
            if A[2] < 0.05: a = mid; A = proj(a)
            else: b = mid; B = proj(b)
        cl = lambda v: int(np.clip(v, -20000, 20000))
        cv2.line(img, (cl(A[0]), cl(A[1])), (cl(B[0]), cl(B[1])), col, 1, cv2.LINE_AA)
    cols = [(0, 255, 255), (255, 0, 255), (0, 255, 0), (255, 128, 0), (0, 128, 255), (255, 255, 0)]
    for i, pc in enumerate(S["pieces"]):
        t, lay, g = pc[0], pc[1], pc[2]; o = pc[3] if len(pc) > 3 else {}; col = cols[i % len(cols)]
        if t == "quad":
            for k in range(4): seg(g[k], g[(k + 1) % 4], col)
        elif t == "poly":
            for k in range(len(g)): seg(g[k], g[(k + 1) % len(g)], col)
        elif t == "box":
            P = box_pts(g, o)
            for a, b in [(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)]: seg(P[a], P[b], col)
        elif t == "lathe":
            cx, cz = g[0], g[1]; prof = g[2]
            for r, y in prof:
                ring = [[cx + r * np.cos(a), y, cz + r * np.sin(a)] for a in np.linspace(0, 2 * np.pi, 25)]
                for k in range(24): seg(ring[k], ring[k + 1], col)
    for t in S.get("tops", []):
        x0, z0, x1, z1, y = t; q = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]
        for k in range(4): seg(q[k], q[(k + 1) % 4], (255, 255, 255))
    cv2.imwrite(out, img); print("overlay", out)

# ---- the side-by-side sheet: the painting (the same window of it as the bench camera frames) left, the bench still right
def vs(stills, bid="at-city"):
    B = ROOT + "/storyboards/series/ancient-aliens/03-atlantis/kit/bench/"
    J = json.load(open(B + bid + "-vs.json")); cw, ch = 960, 540; rows = []
    still = lambda t: cv2.imread(f"{stills}/{J['id']}-anime-pro-draft-t{t:g}.png")
    def label(im, txt):
        cv2.rectangle(im, (0, 0), (14 + 11 * len(txt), 30), (0, 0, 0), -1); cv2.putText(im, txt, (8, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA); return im
    for name, key, row, k, col, t in J["vs"]:
        hi = cv2.resize(cv2.imread(ENV + PLATES[key[:2]]["env"] + "/paint-hi.png"), (W, H), interpolation=cv2.INTER_AREA)
        big = cv2.copyMakeBorder(hi, H, H, W, W, cv2.BORDER_REFLECT)          # outside the plate: mirrored, as the 3D scene carries on
        x0, y0 = int(W + col - 768 * k), int(H + row - 432 * k)
        left = cv2.resize(big[y0:y0 + int(864 * k), x0:x0 + int(1536 * k)], (cw, ch), interpolation=cv2.INTER_AREA)
        s = still(t)
        if s is None: print("missing still", name, t); continue
        rows.append(np.hstack([label(left, f"plate {key[:2]} (painting)"), label(cv2.resize(s, (cw, ch), interpolation=cv2.INTER_AREA), f"{name} (3D bench still)")]))
    mv = [label(cv2.resize(still(t), (640, 360), interpolation=cv2.INTER_AREA), lab[:56]) for name, t, lab in J["moved"] if still(t) is not None]
    if mv:
        while len(mv) % 3: mv.append(np.zeros((360, 640, 3), np.uint8))
        rows += [np.hstack(mv[i:i + 3]) for i in range(0, len(mv), 3)]
    out = B + bid + "-vs.png"; cv2.imwrite(out, np.vstack(rows)); print("wrote", out)

if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--overlay"]: overlay(a[1], a[2])
    elif a[:1] == ["--vs"]: vs(a[1], *(a[2:3]))
    else:
        for k in ([a[1]] if a[:1] == ["--only"] else PLATES): build(k)
