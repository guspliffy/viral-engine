#!/usr/bin/env python3
"""Block C plate 27 (Bimini from above): the texture layers and the scene data of the painted 3D scene "27" (camera projection;
engine/page/props-at-c-plate.js kind cplate, scene data engine/page/props-at-c-plate-27.js).

  python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-27.py            # layers AND scene data
  python3 .../plate-27.py --layers                  # only assets/props/atlantis/c/c-p27.webp, c-p27-clean.webp, c-p27-mask.png
  python3 .../plate-27.py --emit                    # only the scene data into engine/page/props-at-c-plate-27.js (SCENE-JSON block)
  python3 .../plate-27.py --overlay out.png         # the scene's 3D edges (road blocks, cards, decals) drawn over the plate
  python3 .../plate-27.py --vs <stills dir>         # painting | P | S | M | Z -> block-c/bench/at-cplate-27-vs.png (reads at-cplate-27-vs.json)
  python3 .../plate-27.py --cam                     # the painter's camera as a clip camera (printed)

Source: plate-27-bimini-aerial.png (1536 x 1024, the approved plate; no hi-res copy exists, no environment folder), found in
assets/plates/ or on /mnt/project-files (exact path below). Output 2048 x 1365 in assets/props/atlantis/c/:
  c-p27.webp        the plate (projected from the painter's camera onto the 3D pieces)
  c-p27-clean.webp  the plate with the cards painted out (the island, the boat, the buoy, the boat's shadow on the sand), filled row by row
  c-p27-mask.png    grey: 255 = the cards (island, boat, buoy: hard edge, cut by colour inside a hand polygon), <= 112 = the boat's shadow
                    on the sand as a soft decal (alpha = value / 112); the colour of both comes from c-p27.webp at the same place

THE PAINTER'S CAMERA. Fitted by least squares on the corners of 5 road blocks, the road's two edges at 4 rows and the horizon (row 162):
the road runs along -z at x 0 (block tops y -4.9, 0.6 high, 3.65 pitch), the sea is y 0, the sand bed y -5.5. The painting's blocks are
narrower and shorter than the brief's 3.4 x 3.65 (it draws a gap of a third of the pitch): the road is built to the painting.
Deterministic: no random numbers.
"""
import json, math, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../.."))
SRC = "/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/plate-27-bimini-aerial.png"
OUT = ROOT + "/assets/props/atlantis/c/"
JS = ROOT + "/engine/page/props-at-c-plate-27.js"
BENCH = ROOT + "/storyboards/series/ancient-aliens/03-atlantis/block-c/bench/"
W, H, OW, OH = 1536, 1024, 2048, 1365
K = OW / W

# ---- the painter's camera (plate px; hy = the row of the principal point, pitch looks down) ----
CAM = dict(pos=[3.44, 7.51, 0.0], yaw=1.99, pitch=-14.9, f=1314.0, hy=512, cx=768)
TOP, BED, SEA = -4.9, -5.5, 0.0
BW, BD, PITCH = 2.24, 2.57, 3.65        # a block: width, depth, pitch (the painting's, see above)
Z0 = 15.38                              # the front face of the nearest whole block is at z -Z0 (k = 0)
ROAD_END = 486.0                        # where the road runs into the beach in the painting (m ahead)
ISLE_ROW = 197                          # the plate row of the island's waterline (the beach foot)
ISLE_Z = None                           # set from the camera (the depth at which row ISLE_ROW lies on the sea y 0)
SKY_Z, SEA_Z = -1290.0, -250.0          # the sky quad; the sea's near edge (the sand bed shows nearer)

D2R = math.pi / 180


def view_matrix(c=CAM):
    """world -> (u w, v w, _, w) in plate px as the engine builds it (props-at-c-plate.js plateMatrix); u px from the left, v px from the top."""
    yaw, pit = c["yaw"] * D2R, c["pitch"] * D2R
    cy, sy, cp, sp = math.cos(-yaw), math.sin(-yaw), math.cos(-pit), math.sin(-pit)
    Ry = np.array([[cy, 0, sy, 0], [0, 1, 0, 0], [-sy, 0, cy, 0], [0, 0, 0, 1.0]])
    Rx = np.array([[1, 0, 0, 0], [0, cp, -sp, 0], [0, sp, cp, 0], [0, 0, 0, 1.0]])
    T = np.eye(4); T[:3, 3] = [-c["pos"][0], -c["pos"][1], -c["pos"][2]]
    return Rx @ Ry @ T


def project(p, c=CAM):
    q = view_matrix(c) @ np.array([p[0], p[1], p[2], 1.0])
    d = -q[2]
    return (c["cx"] + c["f"] * q[0] / d, c["hy"] - c["f"] * q[1] / d, d)


def ray(px, py, c=CAM):
    """the world direction of the ray through plate pixel (px, py)"""
    v = np.array([(px - c["cx"]) / c["f"], -(py - c["hy"]) / c["f"], -1.0])
    M = view_matrix(c)[:3, :3]
    d = M.T @ v
    return d / np.linalg.norm(d)


def on_plane_y(px, py, y, c=CAM):
    d = ray(px, py, c); o = np.array(c["pos"], float); t = (y - o[1]) / d[1]
    return [round(float(v), 3) for v in o + d * t]


def on_plane_z(px, py, z, c=CAM):
    d = ray(px, py, c); o = np.array(c["pos"], float); t = (z - o[2]) / d[2]
    return [round(float(v), 3) for v in o + d * t]


ISLE_Z = on_plane_y(768, ISLE_ROW, SEA)[2]


def card(x0, x1, row_b, row_t, z, y_b=None):
    """an upright card on the plane z that covers plate px columns x0..x1 and rows row_t..row_b (the corners come from the camera's rays)"""
    bl, br = on_plane_z(x0, row_b, z), on_plane_z(x1, row_b, z)
    tl, tr = on_plane_z(x0, row_t, z), on_plane_z(x1, row_t, z)
    return [bl, br, tr, tl]


# ---------------------------------------------------------------- the road blocks (every 3.65 m; k = 0 is the nearest whole block)
def blocks():
    out = []; k = -1
    while True:
        zf = -(Z0 + PITCH * k)
        if -zf > ROAD_END: break
        out.append([round(-BW / 2, 3), BED, round(zf - BD, 3), round(BW / 2, 3), TOP, round(zf, 3)]); k += 1
    return out


# ---------------------------------------------------------------- the cards (plate px) and what is painted out behind them
# Each card is a hand polygon a little wider than the thing; the colour then keeps the thing and drops the sky / ocean / water round it.
BOAT = [(1030, 486), (1075, 490), (1110, 490), (1124, 462), (1128, 446), (1160, 442), (1158, 390), (1174, 390), (1174, 440), (1186, 470), (1197, 498), (1240, 510), (1300, 520), (1300, 604), (1262, 626), (1200, 648), (1130, 628), (1050, 580), (1020, 520)]
BOAT_SHADOW = [(1056, 556), (1110, 564), (1180, 588), (1250, 612), (1330, 626), (1350, 650), (1322, 672), (1250, 666), (1180, 644), (1110, 614), (1060, 590)]
BUOY = [(790, 534), (806, 531), (822, 538), (834, 556), (842, 572), (846, 586), (828, 596), (800, 596), (780, 588), (784, 568), (790, 550)]
ISLAND = [(165, 205), (165, 184), (330, 182), (396, 172), (420, 156), (470, 140), (520, 126), (560, 112), (640, 100), (760, 94), (880, 92), (1000, 92), (1100, 100), (1160, 116), (1230, 126), (1290, 156), (1330, 170), (1420, 180), (1448, 190), (1448, 205)]
FORCE = [[(1120, 448), (1144, 448), (1148, 500), (1124, 500)], [(1182, 476), (1204, 476), (1208, 542), (1186, 542)], [(1030, 484), (1062, 484), (1090, 504), (1060, 508)]]     # canopy pole, the red post, the bowsprit: thin things the colour rule takes for water
SUBHULL = [(1078, 538), (1233, 588), (1252, 596), (1247, 608), (1108, 568), (1096, 556)]     # the hull under the water, painted like water


def load_plate():
    return Image.open(SRC).convert("RGB")


def poly_mask(polys, size=(W, H), scale=1.0):
    im = Image.new("L", (int(size[0] * scale), int(size[1] * scale)), 0); d = ImageDraw.Draw(im)
    for p in polys: d.polygon([(x * scale, y * scale) for x, y in p], fill=255)
    return np.array(im) > 0


def island_mask(a):
    """a = plate as float rgb; the island = inside ISLAND, from the first leaf / sand / roof pixel down each column (not the sky, nor the
    clouds above it), down to the last sand pixel (not the cyan shallows below), and not the ocean either side of it"""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    inside = poly_mask([ISLAND])
    thing = ((g > b + 6) | (r > b + 14) | (np.maximum(np.maximum(r, g), b) < 95)) & ~((b > r + 38) & (b >= g - 8))
    thing = thing & np.roll(thing, -1, 0)                       # two in a column: no single speck starts the island
    sandy = (r > b + 10) | (g > b + 6)
    isl = np.zeros_like(inside)
    for x in range(W):
        col = inside[:, x] & thing[:, x]
        if not col.any(): continue
        y0 = int(np.argmax(col))
        y1 = H - 1 - int(np.argmax((inside[:, x] & sandy[:, x])[::-1]))
        isl[y0:y1 + 1, x] = inside[y0:y1 + 1, x]
    return isl


def thing_mask(a, poly, water_rule):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    inside = poly_mask([poly])
    return inside & ~water_rule(r, g, b)


def clean_up(m, grow=0):
    """drop specks and pinholes: close, then open, with PIL min / max filters (size 3)"""
    im = Image.fromarray((m * 255).astype(np.uint8))
    for _ in range(1): im = im.filter(ImageFilter.MaxFilter(3))
    for _ in range(1): im = im.filter(ImageFilter.MinFilter(3))
    im = im.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    for _ in range(grow): im = im.filter(ImageFilter.MaxFilter(3))
    return np.array(im) > 127


def masks():
    a = np.asarray(load_plate(), np.float32)
    isl = clean_up(island_mask(a))
    boat = clean_up(thing_mask(a, BOAT, lambda r, g, b: (r < 115) & (b > r + 55) & (g > r + 42) & (b - g < 48)) | poly_mask([SUBHULL] + FORCE))
    buoy = clean_up(thing_mask(a, BUOY, lambda r, g, b: (b > r + 55) & (g > r + 50) & (r < 120)))
    return dict(island=isl, boat=boat, buoy=buoy)


K2 = lambda p: [(x * K, y * K) for x, y in p]


def big(m, soft=0):
    """a plate-size boolean mask -> layer size (2048 x 1365), optionally feathered; float 0..1"""
    im = Image.fromarray((m * 255).astype(np.uint8)).resize((OW, OH), Image.BILINEAR)
    if soft: im = im.filter(ImageFilter.GaussianBlur(soft * K))
    return np.asarray(im, np.float32) / 255


def dilate(m, n):
    im = Image.fromarray((m * 255).astype(np.uint8))
    for _ in range(n): im = im.filter(ImageFilter.MaxFilter(3))
    return np.array(im) > 127


def tile_fill(out, mask, src, rows=(0, OH)):
    """paint the masked pixels of the rows out: each row takes its own pixels from the source columns (layer px), tiled back and forth"""
    x0, x1 = int(src[0]), int(src[1]); L = x1 - x0; xs = np.arange(OW); ph = np.mod(xs - x0, 2 * L); idx = x0 + np.where(ph < L, ph, 2 * L - 1 - ph)
    for y in range(max(0, rows[0]), min(OH, rows[1])):
        r = mask[y]
        if r.any(): out[y, r] = out[y, idx[r]]


def seam(out, mask):
    soft = np.asarray(Image.fromarray(out).filter(ImageFilter.GaussianBlur(1.3)))
    edge = dilate(mask, 3) & ~np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)) ) .astype(bool)
    out[edge] = soft[edge]


def layers():
    M = masks()
    src = load_plate().resize((OW, OH), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    src.save(OUT + "c-p27.webp", quality=92, method=6)
    clean = np.asarray(src).copy()
    L = lambda m: np.array(Image.fromarray((m * 255).astype(np.uint8)).resize((OW, OH), Image.NEAREST)) > 127
    allm = np.zeros((OH, OW), bool)
    # the boat's shadow on the sand first (from the clear water left of the boat), then the hull, the buoy and the island
    sh = L(dilate(poly_mask([BOAT_SHADOW]), 3)); tile_fill(clean, sh, (1000 * K, 1050 * K), (int(540 * K), int(700 * K))); allm |= sh
    bm = L(dilate(M["boat"], 3)); tile_fill(clean, bm, (990 * K, 1040 * K), (int(390 * K), int(660 * K))); allm |= bm
    um = L(dilate(M["buoy"], 5)); tile_fill(clean, um, (862 * K, 892 * K), (int(520 * K), int(620 * K))); allm |= um
    im_ = L(dilate(M["island"], 4))
    left = im_.copy(); left[:, int(768 * K):] = False; right = im_.copy(); right[:, :int(768 * K)] = False
    tile_fill(clean, left, (20 * K, 150 * K), (int(80 * K), int(215 * K))); tile_fill(clean, right, (1452 * K, 1530 * K), (int(80 * K), int(215 * K))); allm |= im_
    seam(clean, allm)
    Image.fromarray(clean).save(OUT + "c-p27-clean.webp", quality=92, method=6)
    # the mask: 255 the cards (hard), the boat's shadow soft <= 110 (alpha = value / 110 on the decal), none under a card
    card = L(M["island"]) | L(M["boat"]) | L(M["buoy"])
    soft = big(poly_mask([BOAT_SHADOW]), 9) * 110
    mask = np.where(card, 255, soft).astype(np.uint8)
    Image.fromarray(mask).save(OUT + "c-p27-mask.png", optimize=True)
    print("built c-p27.webp, c-p27-clean.webp, c-p27-mask.png; island", int(M["island"].sum()), "boat", int(M["boat"].sum()), "buoy", int(M["buoy"].sum()))


# ---------------------------------------------------------------- the scene data
BOAT_Z = on_plane_y(1170, 590, SEA)[2]       # the hull's waterline (its middle) fixes the boat card's depth
BUOY_Z = on_plane_y(815, 583, SEA)[2]


def scene():
    far = lambda y0, y1, z: [[-2600, y0, z], [2600, y0, z], [2600, y1, z], [-2600, y1, z]]
    pcs = []
    pcs.append(["quad", "clean", far(-120, 900, SKY_Z)])                                                   # the sky and the far horizon strip
    pcs.append(["quad", "water", [[-3000, SEA, SEA_Z], [3000, SEA, SEA_Z], [3000, SEA, SKY_Z + 10], [-3000, SEA, SKY_Z + 10]]])   # the sea out there
    pcs.append(["quad", "water", [[-3000, BED, 40], [3000, BED, 40], [3000, BED, SKY_Z + 10], [-3000, BED, SKY_Z + 10]]])         # the sand bed
    for b in blocks(): pcs.append(["box", "water", b])                                                       # the road, every block
    pcs.append(["quad", "cut", card(165, 1448, ISLE_ROW + 9, 90, ISLE_Z), {"g": "island"}])               # the island
    pcs.append(["quad", "decal", [on_plane_y(x, y, BED + 0.02) for x, y in [(1040, 548), (1360, 548), (1360, 690), (1040, 690)]], {"g": "boat"}])   # the boat's shadow on the sand
    pcs.append(["quad", "cut", card(1018, 1304, 650, 388, BOAT_Z), {"g": "boat", "bob": 0.4}])            # the boat
    pcs.append(["quad", "cut", card(772, 852, 604, 522, BUOY_Z), {"g": "buoy", "bob": 1.7}])             # the buoy
    tops = []
    for b in blocks()[:14]: tops.append([b[0], b[2], b[3], b[5], TOP])
    c = dict(CAM); c["pos"] = [round(v, 3) for v in c["pos"]]
    return {"file": "c-p27", "clean": True, "mask": True, "size": [W, H], "cam": c, "pieces": pcs, "tops": tops}


def emit():
    S = scene()
    src = open(JS).read()
    block = "/*SCENE-JSON-BEGIN*/\nconst SCENE_27 = " + json.dumps(S, separators=(",", ":")) + ";\n/*SCENE-JSON-END*/"
    new, n = re.subn(r"/\*SCENE-JSON-BEGIN\*/.*?/\*SCENE-JSON-END\*/", lambda m: block, src, flags=re.S)
    if n != 1: raise SystemExit("props-at-c-plate-27.js has no SCENE-JSON block (write the module first)")
    open(JS, "w").write(new); print("wrote the scene data:", len(S["pieces"]), "pieces,", len(S["tops"]), "tops")


def read_scene():
    m = re.search(r"/\*SCENE-JSON-BEGIN\*/\s*const SCENE_27 = (.*?);\s*/\*SCENE-JSON-END\*/", open(JS).read(), re.S)
    return json.loads(m.group(1))


# ---------------------------------------------------------------- the overlay: the scene's edges drawn over the plate
def overlay(out):
    S = read_scene(); c = S["cam"]; im = load_plate(); d = ImageDraw.Draw(im)
    cols = [(255, 0, 255), (0, 255, 255), (255, 255, 0), (255, 128, 0), (0, 255, 0)]
    def P(p): return project(p, c)[:2]
    def seg(a, b, col, w=1):
        A, B = project(a, c), project(b, c)
        if A[2] < 0.1 or B[2] < 0.1: return
        lim = lambda v: max(-20000, min(20000, v))
        d.line([(lim(A[0]), lim(A[1])), (lim(B[0]), lim(B[1]))], fill=col, width=w)
    for i, pc in enumerate(S["pieces"]):
        t, lay, g = pc[0], pc[1], pc[2]; col = cols[i % len(cols)]
        if t == "quad":
            for k in range(4): seg(g[k], g[(k + 1) % 4], (255, 255, 255) if lay in ("cut", "decal") else (80, 80, 255), 1)
        elif t == "box":
            x0, y0, z0, x1, y1, z1 = g
            pts = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]
            for a, b in [(4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7), (0, 1), (1, 2), (2, 3), (3, 0)]: seg(pts[a], pts[b], (255, 0, 255) if a >= 4 and b >= 4 else (255, 255, 0))
    for t in S.get("tops", []):
        x0, z0, x1, z1, y = t; q = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]
        for k in range(4): seg(q[k], q[(k + 1) % 4], (255, 255, 255))
    im.save(out); print("overlay", out)


# ---------------------------------------------------------------- the sheet: painting | P, painting | Z, S | M, H | R (reads at-cplate-27-vs.json)
def vs(stills):
    from PIL import ImageFont
    J = json.load(open(BENCH + "at-cplate-27-vs.json")); cw, ch = 960, 540
    plate = load_plate(); still = lambda t: Image.open(f"{stills}/{J['id']}-anime-pro-draft-t{t:g}.png").convert("RGB").resize((cw, ch), Image.LANCZOS)
    font = ImageFont.load_default()
    def label(im, txt):
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 12 + 7 * len(txt), 16], fill=(0, 0, 0)); d.text((5, 3), txt, fill=(255, 255, 255), font=font); return im
    def window(row, col, k):          # the painting's own window for a 16:9 frame k of the plate's width wide, mirrored outside the plate
        w, h = 1536 * k, 864 * k; x0, y0 = col - w / 2, row - h / 2
        im = plate.crop((int(round(x0)), int(round(y0)), int(round(x0 + w)), int(round(y0 + h)))); return im.resize((cw, ch), Image.LANCZOS)
    name, key, row, k, col, t = J["vs"][0]; oth = {o[0]: o for o in J["others"]}
    rows = [[label(window(row, col, k), "plate 27 (painting)"), label(still(t), "P: painter's camera (3D)")],
            [label(window(540, 1150, 0.5), "plate 27 (painting), the Z window"), label(still(oth["Z"][1]), oth["Z"][2])],
            [label(still(oth["S"][1]), oth["S"][2]), label(still(oth["M"][1]), oth["M"][2])],
            [label(still(oth["H"][1]), oth["H"][2]), label(still(oth["R"][1]), oth["R"][2])]]
    sheet = Image.new("RGB", (cw * 2, ch * len(rows)))
    for j, r in enumerate(rows):
        for i2, im in enumerate(r): sheet.paste(im, (i2 * cw, j * ch))
    out = BENCH + "at-cplate-27-vs.png"; sheet.save(out); print("wrote", out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--layers"]: layers()
    elif a[:1] == ["--emit"]: emit()
    elif a[:1] == ["--overlay"]: overlay(a[1])
    elif a[:1] == ["--vs"]: vs(a[1])
    elif a[:1] == ["--cam"]: print(json.dumps(CAM))
    else: layers(); emit()
