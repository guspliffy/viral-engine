"""The anime face for our own bodies (stage 2 of the own-character pipeline), run inside Blender by build_body.py.

Anime faces are mostly drawn, not sculpted: like VRoid and most anime models, the eyes, brows and mouth are painted
textures on thin "decal" sheets that follow the face, and an expression swaps one drawing for another. Here:

  1. flatten(): the MakeHuman eye sockets and lips are smoothed into one soft surface (an anime face has no deep
     sockets; the sockets made the painted eyes bend and threw socket shadows)
  2. every face part (eyes, brows, mouth, nose + blush) is a grid projected onto that surface from the front, 1.2 mm
     out, with its own texture drawn here in code (numpy signed distances: clean strokes at any size)
  3. each part has several drawings (eyes: open / closed / happy / wide ...). One mesh per drawing; the default ones
     show, the others sit folded up behind the face. An expression is a shape key that unfolds one drawing and folds
     another away, so the engine's VRM expressions (blink, happy, ...) drive them with no engine change
  4. all parts are joined into one object "Face", skinned rigidly to the head bone

Face coordinates: metres, x = the character's left (+), z = up; the face looks toward -y (MakeHuman in Blender).
"""
import bpy, bmesh, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

# ---------------------------------------------------------------- drawing kit (all sizes in metres on the face)
class Canvas:
    def __init__(self, x0, x1, z0, z1, px_per_m=24000):
        self.x0, self.x1, self.z0, self.z1 = x0, x1, z0, z1
        self.W = max(64, int((x1 - x0) * px_per_m)); self.H = max(64, int((z1 - z0) * px_per_m))
        xs = np.linspace(x0, x1, self.W); zs = np.linspace(z1, z0, self.H)       # row 0 = top
        self.X, self.Z = np.meshgrid(xs, zs)
        self.rgba = np.zeros((self.H, self.W, 4), np.float32)
        self.aa = 1.2 * (x1 - x0) / self.W                                     # one pixel of soft edge

    def fill(self, d, color, alpha=1.0):
        """paint where the signed distance d < 0 (soft edge one pixel wide)"""
        a = np.clip(0.5 - d / self.aa, 0, 1) * alpha
        c = np.array(color[:3], np.float32)
        out = self.rgba
        ao = out[..., 3:4]; an = a[..., None]
        out[..., :3] = out[..., :3] * (1 - an) + c * an
        out[..., 3:4] = ao + an * (1 - ao)

    def image(self, name):
        img = bpy.data.images.new(name, self.W, self.H, alpha=True)
        px = self.rgba[::-1].copy()                                             # Blender rows start at the bottom
        px[..., :3] = np.where(px[..., 3:4] > 0, px[..., :3], 0)
        img.pixels.foreach_set(px.ravel()); img.pack(); return img

def hexc(h, a=1.0):
    h = h.lstrip("#"); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [a]

def ellipse(c, cx, cz, rx, rz, rot=0.0):
    x, z = c.X - cx, c.Z - cz
    if rot: x, z = x * math.cos(rot) + z * math.sin(rot), -x * math.sin(rot) + z * math.cos(rot)
    k = np.sqrt((x / rx) ** 2 + (z / rz) ** 2)
    return (k - 1) * min(rx, rz)

def stroke(c, pts, w0, w1=None):
    """a tapered stroke through points [(x, z), ...]: width w0 at the start, w1 at the end (Catmull-Rom sampled)"""
    w1 = w0 if w1 is None else w1
    P = np.array(pts, np.float64)
    if len(P) > 2:
        S = []
        for i in range(len(P) - 1):
            p0, p1, p2, p3 = P[max(0, i - 1)], P[i], P[i + 1], P[min(len(P) - 1, i + 2)]
            for t in np.linspace(0, 1, 12, endpoint=False):
                t2, t3 = t * t, t * t * t
                S.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
        S.append(P[-1]); P = np.array(S)
    d = np.full(c.X.shape, 1e9)
    n = len(P) - 1
    for i in range(n):
        a, b = P[i], P[i + 1]; ab = b - a; L2 = max(ab @ ab, 1e-12)
        t = np.clip(((c.X - a[0]) * ab[0] + (c.Z - a[1]) * ab[1]) / L2, 0, 1)
        dx, dz = c.X - (a[0] + t * ab[0]), c.Z - (a[1] + t * ab[1])
        u = (i + t) / n; w = w0 + (w1 - w0) * u
        d = np.minimum(d, np.sqrt(dx * dx + dz * dz) - w / 2)
    return d

def arc_pts(cx, cz, rx, rz, a0, a1, n=9):
    return [(cx + rx * math.cos(a), cz + rz * math.sin(a)) for a in np.linspace(a0, a1, n)]

# ---------------------------------------------------------------- the drawings
def draw_eye(c, ex, ez, side, S, state):
    """one anime eye at (ex, ez); side +1 = the character's left; S = spec["face"]"""
    w, h = S["eyeW"] / 2, S["eyeH"] / 2
    line, iris, iris2 = hexc(S.get("lash", "#2b1d18")), hexc(S.get("iris", "#5a3a26")), hexc(S.get("iris2", "#a0703f"))
    out = side      # outer corner direction in x
    if state in ("open", "wide"):
        sh = h * (1.12 if state == "wide" else 1.0)
        # white of the eye: a rounded shape, flatter on top (the upper lid), the outer corner a little higher
        dW = ellipse(c, ex, ez - sh * 0.05, w, sh * 0.92)
        c.fill(dW, hexc(S.get("white", "#fbf6ee")))
        ir = S["irisR"] * (0.86 if state == "wide" else 1.0)
        icx, icz = ex - out * w * 0.04, ez - sh * 0.08
        dI = np.maximum(ellipse(c, icx, icz, ir * 0.92, ir * 1.1), dW)
        c.fill(dI, iris)
        # the lower half lit (anime irises glow from below), a dark rim and pupil
        dLow = np.maximum(dI + ir * 0.18, -(c.Z - (icz - ir * 0.15)))
        c.fill(np.maximum(dLow, ellipse(c, icx, icz - ir * 0.35, ir * 0.7, ir * 0.55)), iris2, 0.75)
        c.fill(np.maximum(dI, -(dI + ir * 0.12)), line, 0.55)                       # iris rim
        c.fill(np.maximum(ellipse(c, icx, icz + ir * 0.02, ir * 0.42, ir * 0.55), dW), line, 0.9)   # pupil
        c.fill(np.maximum(ellipse(c, icx, icz + ir * 0.62, ir * 0.9, ir * 0.42), dW), line, 0.35)   # lid shadow
        c.fill(ellipse(c, icx - out * ir * 0.35, icz + ir * 0.42, ir * 0.24, ir * 0.3), hexc("#ffffff"))   # catch light
        c.fill(ellipse(c, icx + out * ir * 0.38, icz - ir * 0.45, ir * 0.11, ir * 0.11), hexc("#ffffff"), 0.85)
        # upper lash line: thick, heavier at the outer corner with a small flick; the crease above it
        top = arc_pts(ex, ez - sh * 0.05, w * 1.04, sh * 0.95, math.pi if out > 0 else 0, 0 if out > 0 else math.pi)
        top = [(x, z) for (x, z) in top][1:-1] if False else top
        lash = top[1:] + [(ex + out * w * 1.22, ez + sh * 0.22)]
        c.fill(stroke(c, lash, S.get("lashW", 0.0016), S.get("lashW", 0.0016) * 1.9), line)
        c.fill(stroke(c, arc_pts(ex + out * w * 0.08, ez + sh * 0.18, w * 0.92, sh * 0.95, math.radians(35 if out > 0 else 145), math.radians(150 if out > 0 else 30), 6), 0.0005, 0.0003), line, 0.7)
        # lower lash: short and thin, outer half only
        c.fill(stroke(c, arc_pts(ex, ez - sh * 0.02, w * 0.95, sh * 0.92, math.radians(-20 if out > 0 else 200), math.radians(-60 if out > 0 else 240), 5), 0.0006, 0.0002), line, 0.8)
    elif state == "closed":
        pts = arc_pts(ex, ez + h * 0.25, w * 1.02, h * 0.55, math.pi if out > 0 else 0, 2 * math.pi if out > 0 else -math.pi, 9)
        pts = [(x, z) for (x, z) in pts]
        c.fill(stroke(c, pts + [(ex + out * w * 1.2, ez - h * 0.02)], S.get("lashW", 0.0016) * 0.9, S.get("lashW", 0.0016) * 1.3), line)
    elif state == "happy":      # ^ ^
        pts = arc_pts(ex, ez - h * 0.35, w * 0.95, h * 0.8, math.radians(170 if out > 0 else 10), math.radians(10 if out > 0 else 170), 9)
        c.fill(stroke(c, pts, S.get("lashW", 0.0016) * 1.1, S.get("lashW", 0.0016) * 1.1), line)

def draw_brow(c, ex, ez, side, S, state):
    w = S["eyeW"] * 0.62; base = ez + S["eyeH"] * 0.95 + S.get("browUp", 0.004)
    lift = {"neutral": (0, 0), "up": (0.004, 0.003), "angry": (-0.004, 0.002), "worried": (0.003, -0.002)}[state]
    inner = (ex - side * w * 0.95, base + lift[0]); mid = (ex + side * w * 0.05, base + 0.0022 + (lift[0] + lift[1]) / 2)
    outer = (ex + side * w * 1.05, base - 0.0015 + lift[1])
    c.fill(stroke(c, [inner, mid, outer], S.get("browW", 0.0019), 0.0006), hexc(S.get("brow", "#3a2a20")))

def draw_mouth(c, mx, mz, S, state):
    w = S.get("mouthW", 0.022) / 2; line = hexc(S.get("lip", "#6b3a30"))
    if state == "neutral":
        lw = S.get("mouthLine", 0.0013)
        c.fill(stroke(c, [(mx - w * 0.6, mz + 0.0003), (mx, mz - 0.0003), (mx + w * 0.6, mz + 0.0003)], lw, lw * 0.75), line)
    elif state == "smile":
        c.fill(stroke(c, arc_pts(mx, mz + w * 0.5, w * 0.85, w * 0.6, math.radians(200), math.radians(340), 7), S.get("mouthLine", 0.0013)), line)
    elif state in ("open", "o"):
        if state == "open": d = np.maximum(ellipse(c, mx, mz - w * 0.25, w * 0.8, w * 0.75), c.Z - (mz + w * 0.12))
        else: d = ellipse(c, mx, mz - w * 0.1, w * 0.36, w * 0.45)
        c.fill(d, hexc(S.get("mouthIn", "#7a2e2a")))
        c.fill(np.maximum(d, ellipse(c, mx, mz - w * (0.85 if state == "open" else 0.5), w * 0.55, w * 0.35)), hexc(S.get("tongue", "#d0705f")))
        c.fill(np.maximum(d, -(d + 0.0007)), line)
    elif state == "frown":
        c.fill(stroke(c, arc_pts(mx, mz - w * 0.55, w * 0.7, w * 0.5, math.radians(30), math.radians(150), 7), S.get("mouthLine", 0.0013)), line)

def draw_static(c, S, nose, cheeks):
    # nose: a small shadow tick under the tip, blush: soft hatched ovals (the potato cast's blush)
    nx, nz = nose
    c.fill(stroke(c, [(nx + 0.0012, nz + 0.0012), (nx - 0.0004, nz - 0.0006), (nx - 0.0022, nz - 0.0004)], 0.0008, 0.0005), hexc(S.get("lip", "#6b3a30")), 0.65)
    for (bx, bz) in cheeks:
        c.fill(ellipse(c, bx, bz, 0.011, 0.0055), hexc(S.get("blush", "#f08a7a")), S.get("blushA", 0.28))
        for k in range(-2, 3):
            c.fill(stroke(c, [(bx + k * 0.0032 - 0.001, bz - 0.0025), (bx + k * 0.0032 + 0.0012, bz + 0.0025)], 0.0005), hexc(S.get("blush", "#f08a7a")), 0.45)

# ---------------------------------------------------------------- the face surface
def flatten(body, eyes, S):
    """smooth the eye sockets and the lips into a soft surface (moves front-facing face vertices only)"""
    mw = body.matrix_world; inv = mw.inverted()
    me = body.data
    co = np.array([mw @ v.co for v in me.vertices]); nrm = np.array([(mw.to_3x3() @ v.normal).normalized() for v in me.vertices])
    (lc, lr), (rc, rr) = eyes["l"], eyes["r"]
    face_c = (np.array(lc) + np.array(rc)) / 2
    # a smooth front surface: per vertex, the depth of a wide quadratic fit to the face front around it
    region = (np.abs(co[:, 0] - face_c[0]) < 0.075) & (co[:, 2] > face_c[2] - 0.085) & (co[:, 2] < face_c[2] + 0.05) & (nrm[:, 1] < -0.2)
    idx = np.where(region)[0]; P = co[idx]
    def fit_depth(x, z):
        # least-squares y = a + bx + cz + dx^2 + ez^2 + fxz over points within 3 cm, weighted
        dx, dz = P[:, 0] - x, P[:, 2] - z; r2 = dx * dx + dz * dz
        w = np.exp(-r2 / (2 * 0.013 ** 2)); m = w > 1e-3
        A = np.stack([np.ones(m.sum()), dx[m], dz[m], dx[m] ** 2, dz[m] ** 2, dx[m] * dz[m]], 1) * np.sqrt(w[m])[:, None]
        b = P[m, 1] * np.sqrt(w[m]); sol = np.linalg.lstsq(A, b, rcond=None)[0]; return sol[0]
    moved = 0; inner = set(); nose_set = set()
    zones = [(lc, lr * S.get("socketK", 2.2)), (rc, rr * S.get("socketK", 2.2))]
    nose_zone = (eyes["nose"], S.get("noseZone", 0.022)); zones.append(nose_zone)
    if S.get("mouthFlat", True): zones.append((eyes["mouth"], S.get("mouthW", 0.022) * S.get("mouthZone", 1.8)))
    # the whole lower face (nose to chin, cheek to cheek): the realistic sculpt's laugh lines and lip folds caught the
    # ink pass at mid distance as old-man creases; an anime face there is one smooth surface
    lf = S.get("lowerFace", 0.055)
    if lf: m0 = np.array(eyes["mouth"]); n0 = np.array(eyes["nose"]); zones.append(((0.0, m0[1], (m0[2] + n0[2]) / 2), lf))
    for (c0, rad) in zones:
        c0 = np.array(c0)
        # every vertex of the zone, the socket walls and the inside of the lips too (they face away from the camera;
        # left deep they showed as dark holes edged in ink): all of them collapse onto the soft surface
        near = np.hypot(co[:, 0] - c0[0], co[:, 2] - c0[2]) < rad
        sel = np.where(near & (co[:, 1] > c0[1] - 0.03) & (co[:, 1] < c0[1] + 0.045))[0]
        inner.update(int(i) for i in sel)
        if c0 is not None and rad == nose_zone[1] and tuple(c0) == tuple(nose_zone[0]): nose_set = set(int(i) for i in sel)
        for i in sel:
            x, z = co[i, 0], co[i, 2]
            k = 1 - np.hypot(x - c0[0], z - c0[2]) / rad; k = 3 * k * k - 2 * k * k * k
            yd = fit_depth(x, z)
            if co[i, 1] > yd or True:           # sockets are deeper (larger y); pull every point toward the fit
                co[i, 1] = co[i, 1] + (yd - co[i, 1]) * k; moved += 1
    # then a Taubin smooth (shrink + inflate, so the face keeps its size) fading out from the middle of the lower face:
    # the pull above leaves small steps where a fold crossed the zone edge; this irons them out without a hard edge
    it = S.get("smoothIter", 30)
    if it:
        m0 = np.array(eyes["mouth"]); n0 = np.array(eyes["nose"])
        P0 = np.array([0.0, min(m0[1], n0[1]) - 0.005, (m0[2] + n0[2]) / 2 - 0.01]); R = S.get("smoothR", 0.065)
        d = np.linalg.norm(co - P0, axis=1); w = np.clip(1 - d / R, 0, 1); w = w * w * (3 - 2 * w)
        live = np.where(w > 0)[0]
        nb = [[] for _ in range(len(co))]
        for e in me.edges:
            a, b = e.vertices
            if w[a] > 0 or w[b] > 0: nb[a].append(b); nb[b].append(a)
        for _ in range(it):
            for lam in (0.5, -0.53):
                avg = np.array([co[nb[i]].mean(0) if nb[i] else co[i] for i in live])
                co[live] += (lam * w[live])[:, None] * (avg - co[live])
        print("face: smoothed", len(live), "lower-face vertices")
    for i in range(len(me.vertices)): me.vertices[i].co = inv @ Vector(co[i])
    # the collapsed socket walls and lip insides now lie on the face turned inside out; their back faces caught the
    # ink outline pass (dark jagged spots round the iris and the mouth), so those faces go (the drawings cover the gap)
    bm = bmesh.new(); bm.from_mesh(me)
    bm.normal_update()
    # (a face of the zone now facing into the head, in object space the face looks toward -y, is a collapsed wall)
    fwd = (inv.to_3x3() @ Vector((0, -1, 0))).normalized()
    dead = [f for f in bm.faces if all(v.index in inner for v in f.verts) and f.normal.dot(fwd) < -0.05]
    # the nostrils face down, not back, so they stayed as two dark holes: the nose's underside goes as well
    dead += [f for f in bm.faces if all(v.index in nose_set for v in f.verts) and -0.05 <= f.normal.dot(fwd) < 0.3]
    # deleted, and the hole they leave closed with new faces lying on the soft surface (turned round they still drew
    # ink; left open, the hole's edge drew its own outline, a moustache under the nose)
    bmesh.ops.delete(bm, geom=dead, context="FACES_ONLY")
    loose = [v for v in bm.verts if not v.link_faces]; bmesh.ops.delete(bm, geom=loose, context="VERTS")
    rim = [e for e in bm.edges if e.is_boundary and all(v.index in inner for v in e.verts)]
    filled = bmesh.ops.holes_fill(bm, edges=rim, sides=0)["faces"] if rim else []
    if filled: bmesh.ops.triangulate(bm, faces=filled)
    bm.to_mesh(me); bm.free()
    me.update(); print("face: flattened", moved, "vertices, removed", len(dead), "inside faces, filled", len(filled))

def front_no_line(body, eyes, S):
    """the front of the face (brows to chin, between the cheeks) takes a copy of the skin material that the engine draws
    without the ink hull (name ends _NOLINE): an anime face has no lines inside it, only the drawn eyes, brows and
    mouth; the realistic sculpt's nostrils and lip corners kept catching the hull as ink spots. The jaw, cheeks and the
    side view's silhouette stay on the lined skin."""
    mw = body.matrix_world; me = body.data
    (lc, lr), (rc, rr) = eyes["l"], eyes["r"]
    cx = (lc[0] + rc[0]) / 2; top = (lc[2] + rc[2]) / 2 + S.get("noLineTop", 0.035); bot = eyes["mouth"][2] - S.get("noLineBelow", 0.045)
    half = abs(lc[0] - rc[0]) / 2 + S.get("noLineSide", 0.012)
    skin = me.materials[0]; nl = skin.copy(); nl.name = "Face_00_SKIN_NOLINE"; me.materials.append(nl); k = len(me.materials) - 1
    m3 = mw.to_3x3(); n = 0
    for p in me.polygons:
        c = mw @ p.center; nr = (m3 @ p.normal).normalized()
        # an ellipse narrowing toward the chin, front-facing polygons only
        zz = (c.z - bot) / max(1e-6, top - bot)
        if not (0 <= zz <= 1): continue
        w = half * (0.8 + 0.2 * min(1.0, zz * 1.6))
        # (the middle takes every polygon: the nostrils and the lip corners face down or sideways, and they were the
        # spots; the outer band only the front-facing ones, so the cheeks' silhouette keeps its line)
        if abs(c.x - cx) < w and (nr.y < -0.35 or (abs(c.x - cx) < w * 0.65 and c.z > eyes["mouth"][2] - 0.02) or abs(c.z - eyes["mouth"][2]) < 0.015): p.material_index = k; n += 1
    print("face: front without ink", n, "polygons")

def sphere_normals(body, eyes, S):
    """anime faces shade as one soft ball (Arc System Works / Blue Protocol edit the face normals so light makes clean
    shapes, not every lump of the realistic sculpt): the head's normals are blended toward an ellipsoid's around the
    skull's centre; the blend fades out down the neck"""
    mw = body.matrix_world; me = body.data
    (lc, _), (rc, _) = eyes["l"], eyes["r"]
    c = Vector(((lc[0] + rc[0]) / 2, (lc[1] + rc[1]) / 2 + S.get("skullBack", 0.055), (lc[2] + rc[2]) / 2 - 0.005))
    rad = Vector((0.075, 0.095, 0.11)); k = S.get("sphereK", 0.8)
    neck = eyes["mouth"][2] - 0.045
    me.calc_normals_split() if hasattr(me, "calc_normals_split") else None
    out = []
    for v in me.vertices:
        p = mw @ v.co; n = (mw.to_3x3() @ v.normal).normalized()
        w = k * min(1, max(0, (p.z - neck) / 0.04)) if (p - c).length < 0.16 else 0
        e = Vector(((p.x - c.x) / rad.x ** 2, (p.y - c.y) / rad.y ** 2, (p.z - c.z) / rad.z ** 2)).normalized()
        nn = (n * (1 - w) + e * w).normalized()
        out.append(mw.to_3x3().inverted() @ nn)
    me.normals_split_custom_set_from_vertices([tuple(x.normalized()) for x in out])
    print("face: sphere normals")

def project_grid(bvh, x0, x1, z0, z1, nx, nz, out=0.0012, dilate=0.004):
    """a grid over the face rectangle, each point dropped onto the surface along +y and lifted `out` along -y"""
    verts, ok = [], []
    for j in range(nz + 1):
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; z = z0 + (z1 - z0) * j / nz
            hit = bvh.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)), 2.0)
            if hit[0] is None: verts.append(None); continue
            verts.append(Vector((x, hit[0].y - out, z)))
    # fill misses from neighbours, then smooth depth a little (no pinholes or steps)
    G = np.array([[v.y if v else np.nan for v in verts[j * (nx + 1):(j + 1) * (nx + 1)]] for j in range(nz + 1)])
    for _ in range(50):
        if not np.isnan(G).any(): break
        Gp = np.pad(G, 1, constant_values=np.nan); nb = np.stack([Gp[:-2, 1:-1], Gp[2:, 1:-1], Gp[1:-1, :-2], Gp[1:-1, 2:]])
        G = np.where(np.isnan(G), np.nanmean(nb, 0), G)
    # ride over the highest bump nearby (an eyelid edge or a lip must never poke through a drawing), then smooth
    k = max(1, int(round(dilate / max((x1 - x0) / nx, 1e-6))))
    Gp = np.pad(G, k, mode="edge"); H = G.copy()
    for dj in range(-k, k + 1):
        for di in range(-k, k + 1): H = np.minimum(H, Gp[k + dj:k + dj + G.shape[0], k + di:k + di + G.shape[1]])
    G = H
    for _ in range(3):
        Gp = np.pad(G, 1, mode="edge"); G = np.minimum(G, (Gp[:-2, 1:-1] + Gp[2:, 1:-1] + Gp[1:-1, :-2] + Gp[1:-1, 2:] + 4 * G) / 8)
    pts = [Vector((x0 + (x1 - x0) * i / nx, G[j, i], z0 + (z1 - z0) * j / nz)) for j in range(nz + 1) for i in range(nx + 1)]
    return pts

def decal(name, bvh, rect, canvas, res=(40, 30), out=0.0012):
    x0, x1, z0, z1 = rect; nx, nz = res
    pts = project_grid(bvh, x0, x1, z0, z1, nx, nz, out)
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    V = [bm.verts.new(p) for p in pts]; uv = bm.loops.layers.uv.new("UVMap")
    for j in range(nz):
        for i in range(nx):
            a = j * (nx + 1) + i; quad = [V[a], V[a + 1], V[a + nx + 2], V[a + nx + 1]]
            f = bm.faces.new(quad)
            for loop in f.loops:
                p = loop.vert.co; loop[uv].uv = ((p.x - canvas.x0) / (canvas.x1 - canvas.x0), (p.z - canvas.z0) / (canvas.z1 - canvas.z0))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    obj = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(obj)
    mat = bpy.data.materials.new(f"{name}_FACE"); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]; tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = canvas.image(f"{name}_tex"); tex.interpolation = "Linear"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"]); nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    mat.blend_method = "CLIP"; mat.alpha_threshold = 0.5
    try: mat.surface_render_method = "DITHERED"
    except Exception: pass
    obj.data.materials.append(mat)
    return obj

def build_face(body, rig, eyes, S):
    """eyes: {"l": (centre, radius), "r": ..., "mouth": centre, "nose": centre} in world space"""
    flatten(body, eyes, S)
    if S.get("sphereK", 0.8) > 0: sphere_normals(body, eyes, S)
    if S.get("frontNoLine", True): front_no_line(body, eyes, S)
    dg = bpy.context.evaluated_depsgraph_get(); bvh = BVHTree.FromObject(body, dg)
    (lc, lr), (rc, rr) = eyes["l"], eyes["r"]
    ez = (lc[2] + rc[2]) / 2 + S.get("eyeDrop", -0.002)
    exL, exR = lc[0] + S.get("eyeOut", 0.0), rc[0] - S.get("eyeOut", 0.0)
    mx, mz = eyes["mouth"][0], eyes["mouth"][2] + S.get("mouthUp", 0.002)
    parts = []          # (object, state, group)

    def eye_set(state):
        span = abs(exL - exR) / 2 + S["eyeW"] * 1.05
        rect = (-span + (exL + exR) / 2, span + (exL + exR) / 2, ez - S["eyeH"] * 0.9, ez + S["eyeH"] * 1.0)
        cv = Canvas(*rect)
        for ex, side in ((exL, 1), (exR, -1)): draw_eye(cv, ex, ez, side, S, state)
        return decal(f"Eyes_{state}", bvh, rect, cv, (48, 22))
    for st in ("open", "closed", "happy", "wide"): parts.append((eye_set(st), st, "eyes"))

    def brow_set(state):
        span = abs(exL - exR) / 2 + S["eyeW"] * 1.0
        rect = (-span + (exL + exR) / 2, span + (exL + exR) / 2, ez + S["eyeH"] * 0.55, ez + S["eyeH"] * 1.75 + 0.006)
        cv = Canvas(*rect)
        for ex, side in ((exL, 1), (exR, -1)): draw_brow(cv, ex, ez, side, S, state)
        return decal(f"Brows_{state}", bvh, rect, cv, (40, 10), 0.0016)
    for st in ("neutral", "up", "angry", "worried"): parts.append((brow_set(st), st, "brows"))

    def mouth_set(state):
        w = S.get("mouthW", 0.022); rect = (mx - w * 0.8, mx + w * 0.8, mz - w * 0.75, mz + w * 0.45)
        cv = Canvas(*rect); draw_mouth(cv, mx, mz, S, state)
        return decal(f"Mouth_{state}", bvh, rect, cv, (16, 12))
    for st in ("neutral", "smile", "open", "o", "frown"): parts.append((mouth_set(st), st, "mouth"))

    nose = eyes["nose"]; cheeks = [(exL + 0.004, ez - S["eyeH"] * 1.25), (exR - 0.004, ez - S["eyeH"] * 1.25)]
    rect = (exR - 0.03, exL + 0.03, ez - S["eyeH"] * 2.2, ez - S["eyeH"] * 0.6)
    cv = Canvas(*rect); draw_static(cv, S, (nose[0], nose[2] - 0.004), cheeks)
    static = decal("FaceStatic", bvh, rect, cv, (40, 16), 0.0009)

    # join into one "Face" object; each drawing's vertices are remembered by a vertex group
    objs = [p[0] for p in parts] + [static]
    for o in objs:
        g = o.vertex_groups.new(name=o.name); g.add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = static; bpy.ops.object.join()
    face = bpy.context.view_layer.objects.active; face.name = "Face"
    me = face.data
    def verts_of(gname):
        gi = face.vertex_groups[gname].index
        return [v.index for v in me.vertices if any(g.group == gi for g in v.groups)]
    # a folded drawing: shrunk to its middle and sunk 1 cm into the head (hidden)
    def folded(vids):
        c = sum((me.vertices[i].co for i in vids), Vector()) / len(vids)
        return {i: c + (me.vertices[i].co - c) * 0.02 + Vector((0, 0.01, 0)) for i in vids}
    default = {"eyes": "open", "brows": "neutral", "mouth": "neutral"}
    groups = {}
    for _, st, grp in parts: groups.setdefault(grp, []).append(st)
    full = {v.index: v.co.copy() for v in me.vertices}
    base = dict(full)
    for grp, states in groups.items():
        for st in states:
            if st != default[grp]: base.update(folded(verts_of(f"{grp.capitalize()}_{st}")))
    face.shape_key_add(name="Basis")
    for v in me.vertices: v.co = base[v.index]
    face.data.shape_keys.key_blocks["Basis"].data.foreach_set("co", [c for v in me.vertices for c in base[v.index]])
    keys = {}
    for grp, states in groups.items():
        for st in states:
            if st == default[grp]: continue
            k = face.shape_key_add(name=f"{grp}_{st}", from_mix=False)
            show = verts_of(f"{grp.capitalize()}_{st}"); hide = folded(verts_of(f"{grp.capitalize()}_{default[grp]}"))
            for i in show: k.data[i].co = full[i]
            for i, p in hide.items(): k.data[i].co = p
            keys[f"{grp}_{st}"] = k.name
    # rigid to the head bone
    hg = face.vertex_groups.new(name="head"); hg.add(list(range(len(me.vertices))), 1.0, "REPLACE")
    face.parent = rig; mod = face.modifiers.new("Armature", "ARMATURE"); mod.object = rig
    print("face: parts", len(objs), "keys", list(keys))
    return face, keys

# VRM expressions as combinations of the drawings (Jonny's 9-expression sheet: neutral, smile, surprised, thinking,
# annoyed, determined, laughing, embarrassed, serious): weights are morph binds on "Face"
EXPRESSIONS = {
    "blink": {"eyes_closed": 1}, "blink_left": {"eyes_closed": 1}, "blink_right": {"eyes_closed": 1},
    "happy": {"eyes_happy": 1, "mouth_open": 1, "brows_up": 1},
    "relaxed": {"mouth_smile": 1},
    "surprised": {"eyes_wide": 1, "mouth_o": 1, "brows_up": 1},
    "angry": {"brows_angry": 1, "mouth_frown": 1},
    "sad": {"brows_worried": 1, "mouth_frown": 1},
    "aa": {"mouth_open": 1}, "oh": {"mouth_o": 1}, "ou": {"mouth_o": 1}, "ih": {"mouth_smile": 1}, "ee": {"mouth_smile": 1},
}

def bind_expressions(rig, face, keys):
    preset = rig.data.vrm_addon_extension.vrm1.expressions.preset
    for name, binds in EXPRESSIONS.items():
        ex = getattr(preset, name)
        for k, w in binds.items():
            if k not in keys: continue
            b = ex.morph_target_binds.add(); b.node.mesh_object_name = face.name; b.index = keys[k]; b.weight = w
        ex.is_binary = True
