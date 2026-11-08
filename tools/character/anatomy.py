"""Drawn anatomy for our own bodies (own character creator, run inside Blender by build_body.py after the face).

The reference sheets draw a body's forms with a few brush marks and shadow shapes over flat skin: the neck's muscles,
the collarbones, the chest's lower edge, the abs, the navel. A realistic sculpt under a cel shader instead breaks into
blotches wherever a small bump of it crosses the light (8 Nov: "doesn't look as human as it should"). So:

  1. smooth_normals(): the body's shading normals come from a heavily smoothed copy of it (Guilty Gear Xrd / Blue
     Protocol's edited normals): the light draws the big forms only (chest plane, rib cage, sides, limbs); the head keeps
     its own (face.py sphere_normals), the hands their own
  2. a decal over the front of the torso and neck, projected from the front like the face parts and painted in code:
     lines in a dark warm brown, shadow shapes in the skin's shade colour; skinned with the body's own bone weights, lit
     like the skin (material "Anatomy_00_SKIN_NOLINE": skin role, no ink hull)

Landmarks come from the mesh: the sternal notch (the dip at the bottom of the neck's front) and the navel (the dip
between the clavicles' height and the pelvis); the marks sit in a frame u = x / (half the nipple spacing, "nipW"),
v = (notch z - z) / (notch z - navel z). The male marks below are measured off the male reference sheet's front view.

spec "anatomy": { "smoothN": 0.85 (0 = off), "smoothIter": 80, "style": "male" | null, "line": "#8a5235",
                  "shade": "#dba57a", "nipple": "#cf8f78", "nipW": 0.095, "lineK": 1 (all widths), "navelZ": metres }
"""
import bpy, bmesh, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

import face as facekit
from clothes import _copy_weights


# ---------------------------------------------------------------- 1. shading normals
def smooth_normals(body, A):
    k = A.get("smoothN", 0.85)
    if not k: return
    me = body.data; mw = body.matrix_world; n = len(me.vertices)
    co = np.array([tuple(mw @ v.co) for v in me.vertices])
    E = np.array([e.vertices[:] for e in me.edges], np.int64)
    deg = np.bincount(E.ravel(), minlength=n).astype(np.float64)[:, None]
    P = co.copy()
    for _ in range(A.get("smoothIter", 80)):
        acc = np.zeros_like(P); np.add.at(acc, E[:, 0], P[E[:, 1]]); np.add.at(acc, E[:, 1], P[E[:, 0]])
        P += 0.6 * (acc / np.maximum(deg, 1) - P)
    me.calc_loop_triangles()
    T = np.array([t.vertices[:] for t in me.loop_triangles], np.int64)
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])          # (area weighted)
    vn = np.zeros_like(P)
    for j in range(3): np.add.at(vn, T[:, j], fn)
    vn /= np.linalg.norm(vn, axis=1)[:, None] + 1e-12
    # the normals there now (face.py's head ball included), one per vertex
    cur = np.zeros_like(P)
    try: cn = [tuple(c.vector) for c in me.corner_normals]
    except AttributeError:
        me.calc_normals_split(); cn = [tuple(l.normal) for l in me.loops]
    for l, c in zip(me.loops, cn): cur[l.vertex_index] += c
    m3 = np.array(mw.to_3x3())
    cur = cur @ m3.T; cur /= np.linalg.norm(cur, axis=1)[:, None] + 1e-12
    # where: everything but the head and the hands
    kg = A.get("keepGroups", ("head", "hand_", "thumb_", "index_", "middle_", "ring_", "pinky_"))
    keep = {g.index for g in body.vertex_groups if kg and g.name.startswith(tuple(kg))}
    w = np.full(n, k)
    for v in me.vertices:
        o = sum(g.weight for g in v.groups if g.group in keep)
        w[v.index] *= max(0.0, 1.0 - min(1.0, o))
    out = cur * (1 - w)[:, None] + vn * w[:, None]
    out = out @ np.linalg.inv(m3).T; out /= np.linalg.norm(out, axis=1)[:, None] + 1e-12
    me.normals_split_custom_set_from_vertices([tuple(x) for x in out])
    print("anatomy: smoothed shading normals on", int((w > 0.01).sum()), "vertices")


# ---------------------------------------------------------------- 2. landmarks
def landmarks(body, rig, A):
    mw = body.matrix_world
    V = np.array([tuple(mw @ v.co) for v in body.data.vertices])
    bz = lambda b: (rig.matrix_world @ rig.data.bones[b].head_local).z
    mid = V[(np.abs(V[:, 0]) < 0.005) & (V[:, 1] < 0.0)]
    clav = bz("clavicle_l")
    s = mid[(mid[:, 2] > clav - 0.01) & (mid[:, 2] < clav + 0.06)]
    notch = s[np.argmax(s[:, 1])]                     # the deepest point at the bottom of the neck's front
    if A.get("navelZ"): navel_z = A["navelZ"]
    else:
        s = mid[(mid[:, 2] > bz("pelvis") + 0.08) & (mid[:, 2] < bz("spine_02") + 0.045)]
        # (the dip: deeper than the smooth line through its neighbours 2 cm above and below)
        best, navel_z = -1, None
        for p in s:
            nb = s[np.abs(np.abs(s[:, 2] - p[2]) - 0.02) < 0.006]
            if not len(nb): continue
            d = p[1] - nb[:, 1].mean()
            if d > best: best, navel_z = d, p[2]
    print("anatomy: notch", np.round(notch, 4), "navel z", round(float(navel_z), 4))
    return float(notch[2]), float(navel_z)


# ---------------------------------------------------------------- 3. drawing (bounded strokes on a big canvas)
def _ink(c, pts, w0, w1, color, alpha=1.0):
    """facekit.stroke, computed in its bounding box only (the torso canvas is millions of pixels)"""
    P = np.array(pts); pad = max(w0, w1) + 0.002
    x0, x1, z0, z1 = P[:, 0].min() - pad, P[:, 0].max() + pad, P[:, 1].min() - pad, P[:, 1].max() + pad
    i0 = max(0, int((x0 - c.x0) / (c.x1 - c.x0) * c.W)); i1 = min(c.W, int((x1 - c.x0) / (c.x1 - c.x0) * c.W) + 2)
    j0 = max(0, int((c.z1 - z1) / (c.z1 - c.z0) * c.H)); j1 = min(c.H, int((c.z1 - z0) / (c.z1 - c.z0) * c.H) + 2)
    sub = _Sub(c, i0, i1, j0, j1)
    d = facekit.stroke(sub, pts, w0, w1)
    _blend(c, sub, d, color, alpha)

def _shape(c, upper, lower, color, alpha=1.0):
    """fill between two curves [(x, z)] that share their x span (upper above lower)"""
    U = facekit._curve(upper, 16); L = facekit._curve(lower, 16)
    x0, x1 = min(U[:, 0].min(), L[:, 0].min()), max(U[:, 0].max(), L[:, 0].max())
    z0, z1 = min(U[:, 1].min(), L[:, 1].min()), max(U[:, 1].max(), L[:, 1].max())
    i0 = max(0, int((x0 - c.x0) / (c.x1 - c.x0) * c.W)); i1 = min(c.W, int((x1 - c.x0) / (c.x1 - c.x0) * c.W) + 2)
    j0 = max(0, int((c.z1 - z1) / (c.z1 - c.z0) * c.H)); j1 = min(c.H, int((c.z1 - z0) / (c.z1 - c.z0) * c.H) + 2)
    sub = _Sub(c, i0, i1, j0, j1)
    d = np.maximum(facekit._below(sub, U), -facekit._below(sub, L))
    _blend(c, sub, d, color, alpha)

class _Sub:
    def __init__(self, c, i0, i1, j0, j1):
        self.X, self.Z, self.aa, self.sl = c.X[j0:j1, i0:i1], c.Z[j0:j1, i0:i1], c.aa, (slice(j0, j1), slice(i0, i1))

def _blend(c, sub, d, color, alpha):
    a = (np.clip(0.5 - d / sub.aa, 0, 1) * alpha)[..., None]
    o = c.rgba[sub.sl]; col = np.array(color[:3], np.float32)
    o[..., :3] = o[..., :3] * (1 - a) + col * a; o[..., 3:4] = o[..., 3:4] + a * (1 - o[..., 3:4])

def draw_male(c, A, U, V):
    """the male reference sheet's front (traced off its turnaround, front view): (u, v) marks, mirrored. U(u), V(v) map
    to metres. Sparse on purpose: the sheet suggests the abs with the mid line, one cross and the outer edges; a full
    grid of rows read as ribs."""
    line = facekit.hexc(A.get("line", "#8a5235")); shade = facekit.hexc(A.get("shade", "#dba57a"))
    K = A.get("lineK", 1.0); nv = A.get("nipV", 0.39)
    P = lambda pts, sd: [(U(sd * u), V(v)) for (u, v) in pts]
    for sd in (1, -1):
        # shadow shapes first, lines over them
        # the chest's lower edge: nearly level under the nipple, a crescent of shadow thickening out to the armpit
        top = [(0.45, 0.445), (0.8, 0.452), (1.1, 0.43), (1.32, 0.37), (1.46, 0.3)]
        bot = [(0.45, 0.447), (0.8, 0.475), (1.1, 0.49), (1.32, 0.45), (1.46, 0.32)]
        _shape(c, P(top, sd), P(bot, sd), shade, 0.95)
        # the shoulder's groove between chest and deltoid: a small dark wedge under the collarbone's outer end
        _shape(c, P([(1.07, 0.045), (1.25, 0.03)], sd), P([(1.07, 0.046), (1.17, 0.1), (1.25, 0.031)], sd), line, 0.75)
        # lines
        _ink(c, P([(0.36, -0.17), (0.22, -0.085), (0.09, -0.012)], sd), 0.0011 * K, 0.0019 * K, line, 0.9)       # neck muscle
        _ink(c, P([(0.1, 0.04), (0.28, 0.016), (0.7, 0.006), (1.3, -0.006)], sd), 0.0018 * K, 0.0008 * K, line, 0.9)  # collarbone
        _ink(c, P([(0.02, 0.34), (0.2, 0.4), (0.45, 0.445)], sd), 0.0009 * K, 0.0011 * K, line, 0.8)              # chest, inner edge
        _ink(c, P(top, sd), 0.0011 * K, 0.0017 * K, line, 0.9)                                                     # chest, lower edge
        _ink(c, P([(0.0, 0.578), (0.12, 0.58), (0.25, 0.59)], sd), 0.0026 * K, 0.0005 * K, line, 0.85)          # abs cross
        _ink(c, P([(0.45, 0.62), (0.6, 0.655)], sd), 0.0017 * K, 0.0005 * K, line, 0.8)                           # its ends
        _ink(c, P([(0.06, 0.71), (0.2, 0.716)], sd), 0.0013 * K, 0.0004 * K, line, 0.65)                          # second row
        _ink(c, P([(0.6, 0.67), (0.67, 0.72), (0.7, 0.78)], sd), 0.0019 * K, 0.0003 * K, line, 0.85)             # outer abs
        _ink(c, P([(0.65, 0.87), (0.6, 0.92), (0.54, 0.96)], sd), 0.0017 * K, 0.0003 * K, line, 0.8)
        _ink(c, P([(0.9, 0.51), (1.0, 0.565)], sd), 0.0024 * K, 0.0003 * K, line, 0.85)                          # serratus
        _ink(c, P([(0.7, 0.94), (0.61, 1.03), (0.45, 1.13)], sd), 0.0006 * K, 0.0015 * K, line, 0.7)              # hip line
        # the nipple: a small warm oval, a darker rim
        nx, nz = U(sd * 1.0), V(nv); r = A.get("nipR", 0.0055)
        sub = _Sub(c, *_box(c, nx - r * 2, nx + r * 2, nz - r * 2, nz + r * 2))
        e = facekit.ellipse(sub, nx, nz, r, r * 0.85)
        _blend(c, sub, e, facekit.hexc(A.get("nipple", "#cf8f78")), 0.95)
        _blend(c, sub, np.maximum(e, -(e + 0.0006)), line, 0.45)
    _ink(c, [(U(0), V(0.14)), (U(0), V(0.24))], 0.0010 * K, 0.0006 * K, line, 0.6)                                    # sternum
    _ink(c, [(U(0), V(0.26)), (U(0), V(0.37))], 0.0008 * K, 0.0010 * K, line, 0.6)
    _ink(c, [(U(0), V(0.47)), (U(0), V(0.965))], 0.0010 * K, 0.0010 * K, line, 0.6)                                   # mid line
    for v in (0.71, 0.84): _ink(c, [(U(0), V(v - 0.02)), (U(0), V(v)), (U(0), V(v + 0.02))], 0.0012 * K, 0.0012 * K, line, 0.8)
    _shape(c, [(U(-0.05), V(0.97)), (U(0), V(0.962)), (U(0.05), V(0.97))], [(U(-0.05), V(0.972)), (U(0), V(0.99)), (U(0.05), V(0.972))], shade, 0.95)
    nb = _Sub(c, *_box(c, U(-0.03), U(0.03), V(1.04), V(0.95)))
    _blend(c, nb, facekit.ellipse(nb, U(0), V(0.995), 0.0017 * K, 0.0042 * K), line, 0.85)                           # navel

def _image(c, name):
    img = bpy.data.images.new(name, c.W, c.H, alpha=True)
    img.pixels.foreach_set(c.rgba[::-1].ravel()); img.pack(); return img

def _box(c, x0, x1, z0, z1):
    i0 = max(0, int((x0 - c.x0) / (c.x1 - c.x0) * c.W)); i1 = min(c.W, int((x1 - c.x0) / (c.x1 - c.x0) * c.W) + 2)
    j0 = max(0, int((c.z1 - z1) / (c.z1 - c.z0) * c.H)); j1 = min(c.H, int((c.z1 - z0) / (c.z1 - c.z0) * c.H) + 2)
    return i0, i1, j0, j1


# ---------------------------------------------------------------- 4. the decal
def build_anatomy(body, rig, eyes, A):
    smooth_normals(body, A)
    style = A.get("style", "male")
    if not style: return None
    zN, zB = landmarks(body, rig, A)
    nipW = A.get("nipW", 0.095); H = zN - zB
    U = lambda u: u * nipW
    Vf = lambda v: zN - v * H
    x0, x1 = -1.75 * nipW, 1.75 * nipW; z0, z1 = Vf(1.25), Vf(-0.22)
    c = facekit.Canvas(x0, x1, z0, z1, px_per_m=A.get("px", 5000))
    {"male": draw_male}[style](c, A, U, Vf)
    # straight (not premultiplied) colour, and the clear pixels take the shade colour: the texture's filtering at a
    # cut-out edge then never mixes in black (a dark rim round every shadow shape)
    a = c.rgba[..., 3:4]; rgb = c.rgba[..., :3]
    c.rgba[..., :3] = np.where(a > 1e-3, rgb / np.maximum(a, 1e-3), np.array(facekit.hexc(A.get("shade", "#dba57a"))[:3], np.float32))
    c.image = lambda name, c=c: _image(c, name)
    dg = bpy.context.evaluated_depsgraph_get(); bvh = BVHTree.FromObject(body, dg)
    cell = A.get("cell", 0.006); nx = int((x1 - x0) / cell); nz = int((z1 - z0) / cell)
    obj = facekit.decal("Anatomy", bvh, (x0, x1, z0, z1), c, (nx, nz), A.get("out", 0.0015))
    # only the cells with paint in them stay (the rest would be invisible, clipped, sheets)
    me = obj.data; alpha = c.rgba[..., 3]
    bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table(); bm.normal_update()
    dead = []
    for f in bm.faces:
        xs = [v.co.x for v in f.verts]; zs = [v.co.z for v in f.verts]
        i0, i1, j0, j1 = _box(c, min(xs), max(xs), min(zs), max(zs))
        # (and the cells the front projection lays nearly edge-on, the sides of the neck and chest: their texture's
        # small mip levels smear the lines into blocks of colour in a side view)
        if alpha[j0:j1, i0:i1].max(initial=0) < 0.02 or -f.normal.y < A.get("minFacing", 0.45): dead.append(f)
    bmesh.ops.delete(bm, geom=dead, context="FACES")
    bm.to_mesh(me); bm.free()
    mat = me.materials[0]; mat.name = "Anatomy_00_SKIN_NOLINE"
    _copy_weights(body, obj)
    obj.parent = rig; mod = obj.modifiers.new("Armature", "ARMATURE"); mod.object = rig
    print("anatomy:", style, "decal", len(me.polygons), "faces")
    return obj
