"""Accessories (stage 5 of the own-character pipeline): small rigid parts built from a recipe and fixed to a bone.

    spec["accessories"] = [ { "type": "glasses", "w": 0.044, "h": 0.031, "n": 4.0, "r": 0.0013, "color": "#2b2523" } ]

glasses: two round-rectangle frames (a superellipse: n 2 = oval, 4 = round-rect, 8 = nearly square) as thin tubes in
front of the drawn eyes, a bridge over the nose and the temples back along the head to the ears, kept a few mm off the
skin; rigid on the head bone.
"""
import bpy, bmesh, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def _hex(h):
    h = h.lstrip("#"); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def _mat(name, colour):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*[x ** 2.2 for x in _hex(colour)], 1)
    return m


def _tube(bm, path, r, closed=False, M=6):
    """a round tube of radius r along path (a list of points)"""
    rings = []; n = len(path)
    for i, p in enumerate(path):
        a = path[(i + 1) % n] - path[i - 1] if closed else path[min(i + 1, n - 1)] - path[max(i - 1, 0)]
        a.normalize()
        up = Vector((0, 0, 1)) if abs(a.z) < 0.9 else Vector((0, 1, 0))
        u = a.cross(up).normalized(); w = a.cross(u).normalized()
        rings.append([bm.verts.new(p + (u * math.cos(2 * math.pi * j / M) + w * math.sin(2 * math.pi * j / M)) * r) for j in range(M)])
    for i in range(n if closed else n - 1):
        A, B = rings[i], rings[(i + 1) % n]
        for j in range(M):
            bm.faces.new((A[j], A[(j + 1) % M], B[(j + 1) % M], B[j]))
    if not closed:
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])


def _world_bvh(body):
    mw = body.matrix_world
    return BVHTree.FromPolygons([mw @ v.co for v in body.data.vertices], [list(p.vertices) for p in body.data.polygons])


def glasses(body, rig, eyes, A, face):
    bvh = _world_bvh(body)
    (lc, lr), (rc, rr) = eyes["l"], eyes["r"]
    ez = (lc[2] + rc[2]) / 2 + face.get("eyeDrop", -0.002) + A.get("up", 0.001)
    w, h, nexp, r = A.get("w", 0.044), A.get("h", 0.031), A.get("n", 4.0), A.get("r", 0.0013)
    bm = bmesh.new(); inner_x = {}
    for side, c in (("l", lc), ("r", rc)):
        cx = c[0] + (face.get("eyeOut", 0.0) * (1 if side == "l" else -1)) + A.get("out", 0.0) * (1 if side == "l" else -1)
        # in front of the face: the skin's front at the eye, then the gap
        # (the front-most skin anywhere behind the frame, the nose's bridge included: measured at the eye alone, the
        # frame's inner side sank into the nose)
        ys = []
        for fx in (-0.6, -0.3, 0, 0.3, 0.6):
            for fz in (-0.5, 0, 0.5):
                hit = bvh.ray_cast(Vector((cx + fx * w, -0.5, ez + fz * h)), Vector((0, 1, 0)))
                if hit[0] is not None: ys.append(hit[0].y)
        y0 = (min(ys) if ys else c[1] - lr) - A.get("gap", 0.008)
        ring = []
        for k in range(36):
            a = 2 * math.pi * k / 36; ca, sa = math.cos(a), math.sin(a)
            x = w / 2 * math.copysign(abs(ca) ** (2 / nexp), ca); z = h / 2 * math.copysign(abs(sa) ** (2 / nexp), sa)
            # (the frame follows the face's curve a little: its outer side sits further back)
            yy = y0 + A.get("wrap", 0.006) * ((x * (1 if side == "l" else -1)) / (w / 2) + 1) / 2
            ring.append(Vector((cx + x, yy, ez + z)))
        _tube(bm, ring, r, closed=True)
        inner_x[side] = (cx - w / 2 * (1 if side == "l" else -1), cx + w / 2 * (1 if side == "l" else -1), y0)
    # the bridge: an arch between the inner sides of the frames
    (li, lo, ly), (ri, ro, ry) = inner_x["l"], inner_x["r"]
    br = [Vector((li + (ri - li) * t, (ly + ry) / 2 - 0.002 * math.sin(math.pi * t), ez + h * 0.12 + 0.003 * math.sin(math.pi * t))) for t in [i / 8 for i in range(9)]]
    _tube(bm, br, r * 0.9)
    # the temples: from each frame's outer side back to above the ear, a few mm off the head
    for side, (inx, outx, y0) in inner_x.items():
        sx = 1 if side == "l" else -1
        path = []
        for t in [i / 14 for i in range(15)]:
            p = Vector((outx + sx * 0.004 * t, y0 + A.get("wrap", 0.006) + t * A.get("reach", 0.105), ez + h * 0.3 - t * 0.004))
            loc, nrm, _, d = bvh.find_nearest(p)
            if loc is not None and ((p - loc).dot(nrm) < 0 or d < 0.004):
                p = loc + nrm * 0.004
            path.append(p)
        _tube(bm, path, r * 0.85)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)      # (every tube's faces outward: inward ones were culled)
    me = bpy.data.meshes.new("Glasses"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("Glasses", me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(_mat("Glasses_00_HAIR", A.get("color", "#2b2523")))
    for p in o.data.polygons: p.use_smooth = True
    g = o.vertex_groups.new(name="head"); g.add(list(range(len(me.vertices))), 1.0, "REPLACE")
    o.parent = rig; mod = o.modifiers.new("Armature", "ARMATURE"); mod.object = rig
    print("accessories: glasses", len(me.vertices), "verts")
    return o


def build_accessories(body, rig, eyes, specs, face):
    out = []
    for A in specs:
        if A["type"] == "glasses": out.append(glasses(body, rig, eyes, A, face or {}))
        else: print("accessories: unknown", A["type"])
    return out
