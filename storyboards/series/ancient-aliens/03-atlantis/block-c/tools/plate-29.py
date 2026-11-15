#!/usr/bin/env python3
"""Block C plate 29, the edge road at stormy evening: the texture layers and the scene data of the painted 3D scene "29"
(engine/page/props-at-c-plate.js kind cplate, scene data engine/page/props-at-c-plate-29.js).

  python3 .../plate-29.py                     # build c-p29.webp + c-p29-clean.webp, write the scene data into the JS
  python3 .../plate-29.py --layers            # only the two textures
  python3 .../plate-29.py --scene             # only the scene data (between /*PLATES-JSON-BEGIN*/ and /*PLATES-JSON-END*/)
  python3 .../plate-29.py --overlay out.png   # the scene's 3D edges drawn over the plate (how the camera and the pieces are fitted)
  python3 .../plate-29.py --vs <stills dir>   # painting | P | S | M | Z -> block-c/bench/at-cplate-29-vs.png (reads at-cplate-29-vs.json)

Source: assets/environments/at-edge-road-eve/paint.png (= plate-29-edge-road-evening.png, 1536 x 1024; no hi-res copy exists),
scaled to 2048 x 1365 WebP. Output in assets/props/atlantis/c/:
  c-p29.webp        the plate itself (projected from the painter's camera onto every piece)
  c-p29-clean.webp  the plate with the city (wall, towers, town, palace, rocks) painted out row by row, filled from the open sky
                    and sea at the left of it: what lies BEHIND the city cards (the far sky quad and the sea plane)
No mask: the cards' edges are the polygons themselves (skyline traced from the plate's colours, parapet and tower ranges by hand).

THE PAINTER'S CAMERA (fitted on the painting's lines): pitch 0, horizon row 391 (the sea's edge at the left), the road's two
edges run to ONE vanishing point at column 1350 on that row, so yaw = atan((1350 - 768) / f) = 24.7 deg (turned left of the road).
f = 1267 plate px (= vfov 44 deg of the env's eye), camera 0.71 m over the road top and 0.50 m to the right of its right edge
(the road is 3.6 m wide: the left edge's line in the painting then lands within 15 px). The painting is not a perfect pinhole (its
paving seams do not follow the edges' vanishing point): the road is built from its EDGES, the seams are just paint.
World frame of the scene (the prop at x 0, z 0, y 0): camera (0, 0.71, 0), the road runs along -z, its top y 0 (the floor, so the
engine's contact shadows land on it), the right edge x -0.496, the left edge x -4.096, the sea y -0.4 (the painting shows the
right face about 0.4 m high, not the brief's 0.8). The wall (a straight line in plan, 1/depth linear in column) stands 185 m away
at column 1480 and 215 m at the gate; the town behind it 1.3 to 2.2 times as far. Deterministic: no random numbers.
"""
import json, re, sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
SRC = ROOT + "/assets/environments/at-edge-road-eve/paint.png"
OUT = ROOT + "/assets/props/atlantis/c/"
JS = ROOT + "/engine/page/props-at-c-plate-29.js"
BENCH = ROOT + "/storyboards/series/ancient-aliens/03-atlantis/block-c/bench/"
W, H, OW, OH = 1536, 1024, 2048, 1365
r3 = lambda x: round(float(x), 3)

# ---- the painter's camera
F, CX, HY, VPX = 1267.0, 768.0, 391.0, 1350.0
YAW = math.degrees(math.atan((VPX - CX) / F))
CAMY = 0.71
SY, CY = math.sin(math.radians(YAW)), math.cos(math.radians(YAW))
YSEA = -0.4
W_ROAD = 3.6
XR = -0.44                       # the road's right edge (world x); the camera stands 0.44 m to its right
XL = XR - W_ROAD
ZNEAR, ZFAR = 40.0, -245.0       # road ends: behind the camera, and a little past the gate
CAM = dict(pos=[0, CAMY, 0], yaw=r3(YAW), pitch=0, f=F, cx=CX, hy=HY)

def lift(u, v, w):
    """plate pixel (u, v) at depth w along the camera axis -> world point"""
    return [r3(w * (-SY + CY * (u - CX) / F)), r3(CAMY + w * (HY - v) / F), r3(w * (-CY - SY * (u - CX) / F))]

def lift_r(u, v, R):
    """plate pixel (u, v) at the distance R from the camera (a dome)"""
    d = np.array([-SY + CY * (u - CX) / F, (HY - v) / F, -CY - SY * (u - CX) / F]); d /= np.linalg.norm(d)
    return [r3(d[0] * R), r3(CAMY + d[1] * R), r3(d[2] * R)]

def row_at(w, y):
    """the plate row of the height y at depth w"""
    return HY + F * (CAMY - y) / w

# ---- the wall: a straight line in plan. 1/depth is linear in the plate column (tower width: 70 px at column 1480, 27.5 at 570)
ZR, W70, WSLOPE = 185.0, 70.0, 0.0467
def zwall(u): return ZR * W70 / (W70 - WSLOPE * (1480 - u))
def town_k(u): return 1.3 + 0.9 * min(1.0, max(0.0, (u - 1000) / 250.0))

# ---- hand data: the wall's parapet (top of the gold wall, plate px) and the towers' column ranges
PARAPET = [(540, 328), (556, 320), (573, 316), (620, 305), (670, 297), (727, 287), (753, 277), (835, 260), (880, 253), (913, 248), (980, 238),
           (1043, 230), (1100, 229), (1147, 220), (1200, 208), (1250, 199), (1300, 192), (1350, 187), (1407, 180), (1413, 174), (1416, 152),
           (1450, 150), (1520, 143), (1536, 140)]
TOWERS = [(553, 586), (720, 764), (830, 884), (1042, 1103), (1442, 1522)]
U0 = 538
def parapet_v(u):
    xs = [p[0] for p in PARAPET]; ys = [p[1] for p in PARAPET]
    return float(np.interp(u, xs, ys))

# ---- the city's skyline: the connected body of wall/stone/gold/white/green pixels
def city_mask():
    im = np.asarray(Image.open(SRC).convert("RGB")).astype(int)
    R, G, B = im[..., 0], im[..., 1], im[..., 2]; mn, mx = im.min(2), im.max(2)
    city = ((G - B) > 18) | (mn > 120) | ((G - B >= 4) & (G >= R - 6) & (G > B) & (mx < 140))
    m = Image.fromarray((city * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
    return np.asarray(m) > 0

def component(M, seed, rows=410):
    """the pixels connected to the seed (flood fill, 4-neighbours) inside rows 0..rows"""
    M = M[:rows]; seen = np.zeros_like(M); stack = [seed]; seen[seed[1], seed[0]] = True
    h, w = M.shape
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and M[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; stack.append((nx, ny))
    return seen

def skyline():
    """top row of the city's body for every column from U0 to 1535 (an int array, None where nothing)"""
    M = city_mask(); M[:, :U0] = False
    M = np.asarray(Image.fromarray((M * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))) > 0    # close the rivets and seams
    C = component(M, (700, 330))
    top = {}
    for u in range(U0, W):
        ys = np.nonzero(C[:, u])[0]
        if len(ys): top[u] = int(ys.min()) + 1          # one px inside, away from the sky fringe
    return top

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float); d = b - a; n = np.hypot(*d)
    dist = [abs(d[0] * (p[1] - a[1]) - d[1] * (p[0] - a[0])) / n if n else math.hypot(p[0] - a[0], p[1] - a[1]) for p in pts[1:-1]]
    i = int(np.argmax(dist)) + 1
    if dist[i - 1] > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

def simple_top(top, u0, u1, floor_fn=None, eps=1.1):
    pts = []
    for u in range(u0, u1 + 1):
        if u in top:
            v = top[u]
            if floor_fn: v = max(v, floor_fn(u))
            pts.append((float(u), float(v)))
    return rdp(pts, eps)

# ---- the pieces
def strip(layer, top, wfun, botfun, g=None, minh=1.5):
    """upright ribbon along a plan line: top = [(u, v)], depth wfun(u), bottom row botfun(u, w); one quad per top segment"""
    out = []
    for (ua, va), (ub, vb) in zip(top, top[1:]):
        if ub - ua < 0.5: continue
        wa, wb = wfun(ua), wfun(ub)
        ba, bb = botfun(ua, wa), botfun(ub, wb)
        if max(ba - va, bb - vb) < minh: continue
        o = {"g": g} if g else {}
        out.append(["quad", layer, [lift(ua, va, wa), lift(ub, vb, wb), lift(ub, bb, wb), lift(ua, ba, wa)], o] if o else ["quad", layer, [lift(ua, va, wa), lift(ub, vb, wb), lift(ub, bb, wb), lift(ua, ba, wa)]])
    return out

def sea_bottom(u, w): return row_at(w, YSEA) + 2.0
def sea_row_wall(u): return row_at(zwall(u), YSEA)

def pieces():
    P = []
    # the far sky: a dome patch of the plate (clean: the city painted out), 1300 m from the camera
    us = np.linspace(-3000, 4500, 11); vs = np.linspace(-3500, 398, 7); R = 1300
    for i in range(len(us) - 1):
        for j in range(len(vs) - 1):
            P.append(["quad", "clean", [lift_r(us[i], vs[j], R), lift_r(us[i + 1], vs[j], R), lift_r(us[i + 1], vs[j + 1], R), lift_r(us[i], vs[j + 1], R)]])
    # the sea (water: the clean plate with the shimmer) y -0.4, out to 1300 m
    P.append(["quad", "water", [[-1000, YSEA, ZNEAR], [1000, YSEA, ZNEAR], [1000, YSEA, -1300], [-1000, YSEA, -1300]]])
    # the road: one slab, top y 0, its right face is the painted waterfall wall
    P.append(["box", "base", [r3(XL), YSEA, ZFAR, r3(XR), 0, ZNEAR]])
    top = skyline()
    ptop = [(float(u), float(parapet_v(u))) for u in range(U0, W, 6)] + [(float(W - 1), parapet_v(W - 1))]
    # the wall: from the parapet line down to the sea
    wall = [(float(u), float(v)) for u, v in PARAPET]; wall[-1] = (float(W - 1), wall[-1][1])
    P += strip("base", wall, zwall, sea_bottom, "city")
    # the town behind the wall: houses, hill, palace: from the skyline down to 14 px under the parapet (hidden behind the wall)
    edges = [U0 - 1] + [x for a_, b_ in TOWERS for x in (a_ - 1, b_ + 1)] + [W]
    spans = [(edges[i] + 1, edges[i + 1] - 1) for i in range(0, len(edges) - 1, 2)]       # the open stretches between the towers
    pieces_town = []
    for s0, s1 in spans:
        town = simple_top({u: v for u, v in top.items() if s0 <= u <= s1}, max(s0, U0), min(s1, W - 1), None, 1.1)
        for (ua, va), (ub, vb) in zip(town, town[1:]):
            if ub - ua < 0.5: continue
            pa, pb = parapet_v(ua), parapet_v(ub)
            va, vb = min(va, pa), min(vb, pb)
            if max(pa - va, pb - vb) < 1.5: continue
            wa, wb = zwall(ua) * town_k(ua), zwall(ub) * town_k(ub)
            pieces_town.append(["quad", "base", [lift(ua, va, wa), lift(ub, vb, wb), lift(ub, pb + 14, wb), lift(ua, pa + 14, wa)], {"g": "city"}])
    P += pieces_town
    # the towers: front-facing cards 5 m in front of the wall, skyline traced inside their column range
    for a, b in TOWERS:
        uc = (a + b) / 2; w = zwall(uc) - 5.0
        tp = simple_top(top, a, b, None, 1.0)
        # the tower shaft below the roof is a rectangle to the sea; the skyline is everything above
        P += strip("base", tp, lambda u, w=w: w, sea_bottom, "city")
    return P

def scene():
    return {"file": "c-p29", "size": [W, H], "cam": CAM, "clean": True, "grade": True, "pieces": pieces(),
            "tops": [[r3(XL), ZFAR, r3(XR), ZNEAR, 0]]}

def write_scene():
    S = scene()
    txt = open(JS).read()
    block = "/*PLATES-JSON-BEGIN*/\nconst SCENE_29 = " + json.dumps(S, separators=(",", ":")) + ";\n/*PLATES-JSON-END*/"
    if "/*PLATES-JSON-BEGIN*/" in txt: txt = re.sub(r"/\*PLATES-JSON-BEGIN\*/.*?/\*PLATES-JSON-END\*/", lambda m: block, txt, flags=re.S)
    else: raise SystemExit("props-at-c-plate-29.js has no PLATES-JSON markers")
    open(JS, "w").write(txt)
    print("scene 29:", len(S["pieces"]), "pieces,", len(json.dumps(S)) // 1000, "kB")

# ---- the texture layers
K = OW / W
def build_layers():
    os.makedirs(OUT, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    base = src.resize((OW, OH), Image.LANCZOS)
    base.save(OUT + "c-p29.webp", quality=92, method=6)
    a = np.asarray(base).copy(); top = skyline()
    # the city painted out: for every column from its skyline (4 px up) down to the sea row under the wall, every row takes its own
    # pixels from the open sky / sea at the left of the city (columns 440-530, mirrored back and forth)
    m = Image.new("L", (OW, OH), 0); d = ImageDraw.Draw(m)
    pts = [(u, top[u] - 4) for u in range(U0, W) if u in top]
    poly = [(u * K, v * K) for u, v in pts] + [(u * K, sea_row_wall(u) * K) for u in range(W - 1, U0 - 1, -1) if u in top]
    d.polygon(poly, fill=255)
    M = np.asarray(m.filter(ImageFilter.MaxFilter(5))) > 0
    x0, x1 = int(440 * K), int(530 * K); L = x1 - x0; xs = np.arange(OW); ph = np.mod(xs - x0, 2 * L); idx = x0 + np.where(ph < L, ph, 2 * L - 1 - ph)
    out = a.copy()
    for y in range(OH):
        r = M[y]
        if r.any(): out[y, r] = a[y, idx[r]]
    soft = np.asarray(Image.fromarray(out).filter(ImageFilter.GaussianBlur(1.5)))
    edge = (np.asarray(m.filter(ImageFilter.MaxFilter(9))) > 0) & ~(np.asarray(m.filter(ImageFilter.MinFilter(5))) > 0)
    out[edge] = soft[edge]
    Image.fromarray(out).save(OUT + "c-p29-clean.webp", quality=92, method=6)
    print("built c-p29.webp and c-p29-clean.webp")

# ---- overlay
def read_scene():
    src = open(JS).read()
    m = re.search(r"/\*PLATES-JSON-BEGIN\*/\s*const SCENE_29 = (.*?);\s*/\*PLATES-JSON-END\*/", src, re.S)
    return json.loads(m.group(1))

def overlay(out):
    S = read_scene(); img = Image.open(SRC).convert("RGB"); d = ImageDraw.Draw(img)
    def proj(p):
        x, y, z = p[0] - CAM["pos"][0], p[1] - CAM["pos"][1], p[2] - CAM["pos"][2]
        xc, zc = CY * x - SY * z, SY * x + CY * z; w = -zc
        return (CX + F * xc / w, HY - F * y / w, w) if w > 0.6 else None
    def seg(a, b, col):
        A, B = proj(a), proj(b)
        if A is None and B is None: return
        if A is None or B is None:                      # clip at the near plane (depth 0.6)
            wa = -(SY * (a[0] - CAM["pos"][0]) + CY * (a[2] - CAM["pos"][2])); wb = -(SY * (b[0] - CAM["pos"][0]) + CY * (b[2] - CAM["pos"][2]))
            t = (0.6 - wa) / (wb - wa); mid = [a[i] + (b[i] - a[i]) * t for i in range(3)]
            if A is None: a = mid; A = proj(a)
            else: b = mid; B = proj(b)
            if A is None or B is None: return
        if max(abs(A[0]), abs(A[1]), abs(B[0]), abs(B[1])) > 20000: return
        d.line([A[:2], B[:2]], fill=col, width=1)
    cols = [(0, 255, 255), (255, 0, 255), (0, 255, 0), (255, 160, 0), (0, 128, 255), (255, 255, 0)]
    for i, pc in enumerate(S["pieces"]):
        t, lay, g = pc[0], pc[1], pc[2]; col = cols[i % len(cols)]
        if lay == "clean" and t == "quad": continue
        if t == "quad":
            for k in range(4): seg(g[k], g[(k + 1) % 4], col)
        elif t == "box":
            x0, y0, z0, x1, y1, z1 = g
            P = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]
            for a, b in [(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)]: seg(P[a], P[b], col)
    for x0, z0, x1, z1, y in S.get("tops", []):
        q = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]
        for k in range(4): seg(q[k], q[(k + 1) % 4], (255, 255, 255))
    img.save(out); print("overlay", out)

# ---- the side by side sheet
def vs(stills):
    J = json.load(open(BENCH + "at-cplate-29-vs.json")); cw, ch = 960, 540
    still = lambda t: (Image.open(f"{stills}/{J['id']}-anime-pro-draft-t{t:g}.png").convert("RGB") if os.path.exists(f"{stills}/{J['id']}-anime-pro-draft-t{t:g}.png") else None)
    font = ImageFont.load_default()
    def label(im, txt):
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 14 + 7 * len(txt), 18], fill=(0, 0, 0)); d.text((6, 4), txt, fill=(255, 255, 255), font=font); return im
    plate = Image.open(SRC).convert("RGB")
    big = Image.new("RGB", (W * 3, H * 3))
    for i in range(3):
        for j in range(3):
            t = plate
            if i % 2 == 0: t = t.transpose(Image.FLIP_LEFT_RIGHT)
            if j % 2 == 0: t = t.transpose(Image.FLIP_TOP_BOTTOM)
            big.paste(t, (i * W, j * H))
    def painting(col, row, k):
        x0, y0 = int(W + col - 768 * k), int(H + row - 432 * k)
        return big.crop((x0, y0, x0 + int(1536 * k), y0 + int(864 * k))).resize((cw, ch), Image.LANCZOS)
    rows = []
    n, key, row, k, col, t = J["vs"][0]
    s = still(t)
    if s is not None: rows.append(Image.fromarray(np.hstack([np.asarray(label(painting(col, row, k), "plate 29 (painting)")), np.asarray(label(s.resize((cw, ch), Image.LANCZOS), n + " (3D bench still, the painter's camera)"))])))
    tiles = []
    for name, t, lab in J["others"]:
        s = still(t)
        if s is not None: tiles.append(np.asarray(label(s.resize((640, 360), Image.LANCZOS), lab[:100])))
    while len(tiles) % 3: tiles.append(np.zeros((360, 640, 3), np.uint8))
    for i in range(0, len(tiles), 3): rows.append(Image.fromarray(np.hstack(tiles[i:i + 3])))
    out = BENCH + "at-cplate-29-vs.png"; Image.fromarray(np.vstack([np.asarray(r) for r in rows])).save(out); print("wrote", out)

if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--overlay"]: overlay(a[1])
    elif a[:1] == ["--vs"]: vs(a[1])
    elif a[:1] == ["--layers"]: build_layers()
    elif a[:1] == ["--scene"]: write_scene()
    else: build_layers(); write_scene()
