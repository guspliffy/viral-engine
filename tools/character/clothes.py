"""Our own clothes generator (stage 4 of the own-character pipeline): garments cut from the body itself, by recipe.

    spec["clothes"] = [ { "type": "pants", "color": "#2f4a36", "ease": [0.012, 0.03, 0.036, 0.04], "cuff": 0.05,
                          "stripe": { "color": "#9a2c24", "w": 0.008 } }, ... ]

How a garment is made (the way VRoid and most game pipelines do it, without hand modelling):
- the body's surface under the garment (picked by the bones it follows and by height: waist to ankle for trousers,
  neck to hips and down the arms for tops) is copied, smoothed and subdivided once;
- every point is pushed out from the limb's bone line (not along its own normal: the shell stays a clean tube with no
  lumps from muscles) by an EASE that changes along the limb: a baggy track pant is loose on the thigh and the
  calf, and gathered at an elastic cuff with a puff of cloth bunched above it;
- folds: soft horizontal ripples where cloth bunches (above a cuff, behind the knee), so the toon shading draws folds;
- the copy keeps the body's bone weights, so it bends exactly with the body; the engine hides skin under _CLOTH;
- details are separate thin parts laid on the cloth: a side stripe, an elastic waistband and cuffs.
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


def _ss(x):
    x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)


def _lerp_list(vals, t):
    """vals spread evenly over 0..1, linear in between"""
    t = min(1.0, max(0.0, t)) * (len(vals) - 1); i = min(len(vals) - 2, int(t)); k = t - i
    return vals[i] + (vals[i + 1] - vals[i]) * k


def _bones(rig):
    mw = rig.matrix_world
    return {b.name: (mw @ b.head_local, mw @ b.tail_local) for b in rig.data.bones}


def _closest_on_seg(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-9, ab.dot(ab)))); return a + ab * t, t


def _copy_region(body, keep_vert, name, subdiv=1):
    """a new object: the body's faces whose corners all pass keep_vert, with the body's vertex groups"""
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True); bpy.context.view_layer.objects.active = body
    bpy.ops.object.duplicate(linked=False)
    o = bpy.context.active_object; o.name = name; o.data.name = name
    for m in list(o.modifiers):
        if m.type != "ARMATURE": o.modifiers.remove(m)
    if o.data.shape_keys: o.shape_key_clear()
    mw = o.matrix_world
    bm = bmesh.new(); bm.from_mesh(o.data)
    dead = [f for f in bm.faces if not all(keep_vert(mw @ v.co, v.index) for v in f.verts)]
    bmesh.ops.delete(bm, geom=dead, context="FACES")
    bm.to_mesh(o.data); bm.free()
    o.data.materials.clear()
    arm = [m for m in o.modifiers if m.type == "ARMATURE"]
    for m in arm: o.modifiers.remove(m)
    if subdiv:
        sd = o.modifiers.new("sub", "SUBSURF"); sd.levels = subdiv; sd.render_levels = subdiv
        bpy.ops.object.modifier_apply(modifier="sub")
    for m in arm: pass
    return o


def _finish(o, rig, mat):
    o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = True
    o.parent = rig
    mod = o.modifiers.new("Armature", "ARMATURE"); mod.object = rig


def _leg_axis(B, side):
    """the leg's bone line: hip -> knee -> ankle"""
    th, ca, ft = B[f"thigh_{side}"], B[f"calf_{side}"], B[f"foot_{side}"]
    return [th[0], ca[0], ft[0]]


def _axis_point(p, pts):
    best = None
    for i in range(len(pts) - 1):
        q, t = _closest_on_seg(p, pts[i], pts[i + 1])
        d = (p - q).length
        if best is None or d < best[0]: best = (d, q, i + t)
    return best[1], best[2]


def pants(body, rig, G, B, out):
    """trousers: waist to the cuff, eased out from each leg's bone line"""
    hipZ = (B["thigh_l"][0].z + B["thigh_r"][0].z) / 2
    ankleZ = (B["foot_l"][0].z + B["foot_r"][0].z) / 2
    kneeZ = (B["calf_l"][0].z + B["calf_r"][0].z) / 2
    waistZ = hipZ + G.get("rise", 0.09)
    hemZ = ankleZ + G.get("hem", 0.02)
    def keep(p, i): return hemZ <= p.z <= waistZ
    o = _copy_region(body, keep, G.get("name", "Pants"), G.get("subdiv", 1))
    ease = G.get("ease", [0.03, 0.04, 0.036, 0.026, 0.012])     # from the cuff (t=0) up to the waist (t=1)
    cuff = G.get("cuff", 0.05); puff = G.get("puff", 0.016)
    fold_a = G.get("folds", 0.006); fold_l = G.get("foldLen", 0.045)
    axes = {"l": _leg_axis(B, "l"), "r": _leg_axis(B, "r")}
    pel = B["pelvis"][0]
    mw = o.matrix_world; inv = mw.inverted()
    for v in o.data.vertices:
        p = mw @ v.co
        side = "l" if p.x > 0 else "r"
        t = (p.z - hemZ) / max(1e-6, waistZ - hemZ)
        e = _lerp_list(ease, t)
        # the elastic cuff: tight round the ankle, the cloth above it bunched out
        if cuff and p.z < hemZ + cuff:
            c = (p.z - hemZ) / cuff
            e = G.get("cuffEase", 0.008) + (e + puff - G.get("cuffEase", 0.008)) * _ss(c * 1.6)
        # folds: ripples round the leg (strongest over the cuff and behind the knee)
        rip = math.sin(2 * math.pi * (p.z / fold_l) + 1.7 * math.atan2(p.y, p.x - (0.1 if side == "l" else -0.1)))
        kmask = max(_ss(1 - abs(p.z - kneeZ) / 0.08), _ss(1 - (p.z - hemZ - cuff) / 0.12) if p.z > hemZ + cuff * 0.5 else 0)
        e += fold_a * rip * (0.35 + 0.65 * kmask)
        if p.z > hipZ - 0.04:
            # the seat and the waist: pushed out from the pelvis' centre line, not from each leg
            k = _ss((p.z - (hipZ - 0.04)) / 0.08)
            q, _ = _axis_point(p, axes[side]); r = p - q; r.z = 0
            c0 = Vector((pel.x, pel.y, p.z)); r2 = p - c0; r2.z = 0
            d = r.normalized().lerp(r2.normalized(), k).normalized() if r.length > 1e-6 and r2.length > 1e-6 else r.normalized()
        else:
            q, _ = _axis_point(p, axes[side]); d = p - q; d.z *= 0.2
            d = d.normalized() if d.length > 1e-6 else Vector((0, 0, 0))
        # (between the legs the two tubes would swell into each other: the inside of the thigh eases less)
        inner = d.x * (1 if side == "l" else -1)
        if inner < -0.2 and p.z < hipZ: e *= G.get("innerMin", 0.6) + (1 - G.get("innerMin", 0.6)) * (1 + inner) / 0.8
        v.co = inv @ (p + d * e)
    _finish(o, rig, _mat(G.get("mat", "Pants_00_CLOTH"), G.get("color", "#2f4a36")))
    parts = [o]
    if G.get("stripe"):
        parts.append(_stripe(o, rig, B, G, hemZ, waistZ))
    parts += _bands(o, rig, G, hemZ, waistZ)
    out.extend(parts)
    print("clothes: pants", len(o.data.vertices), "verts, waist", round(waistZ, 3), "hem", round(hemZ, 3))


def _surface_bvh(o):
    mw = o.matrix_world; V = [mw @ v.co for v in o.data.vertices]
    return BVHTree.FromPolygons(V, [list(p.vertices) for p in o.data.polygons])


def _stripe(o, rig, B, G, z0, z1):
    """a side stripe laid on the cloth: down the outer side of each leg, a thin ribbon 1.5 mm off the surface"""
    S = G["stripe"]; w = S.get("w", 0.008); bvh = _surface_bvh(o)
    bm = bmesh.new(); src = o
    for side, sx in (("l", 1), ("r", -1)):
        axis = _leg_axis(B, side); rows = []
        n = 60
        for k in range(n + 1):
            z = z0 + 0.03 + (z1 - 0.05 - z0 - 0.03) * k / n
            # the axis point at this height, then a ray in from far out to the side finds the cloth's outer side
            a = None
            for i in range(len(axis) - 1):
                if (axis[i].z - z) * (axis[i + 1].z - z) <= 0:
                    t = (z - axis[i].z) / (axis[i + 1].z - axis[i].z); a = axis[i].lerp(axis[i + 1], t)
            if a is None: a = Vector((axis[0].x, axis[0].y, z))
            a = Vector((a.x, a.y, z))
            hit = bvh.ray_cast(a + Vector((sx * 0.4, 0, 0)), Vector((-sx, 0, 0)))
            if hit[0] is None: continue
            pt, nrm = hit[0], hit[1]
            if nrm.x * sx < 0: nrm = -nrm
            up = Vector((0, 0, 1)); across = nrm.cross(up).normalized()
            rows.append((pt + nrm * 0.0015 - across * w / 2, pt + nrm * 0.0015 + across * w / 2))
        vs = [(bm.verts.new(l), bm.verts.new(r)) for l, r in rows]
        for i in range(len(vs) - 1):
            a, b = vs[i], vs[i + 1]
            f = bm.faces.new((a[0], a[1], b[1], b[0]))
            if f.normal.x * sx < 0: f.normal_flip()
    me = bpy.data.meshes.new("Stripe"); bm.to_mesh(me); bm.free()
    st = bpy.data.objects.new("Stripe", me); bpy.context.scene.collection.objects.link(st)
    _copy_weights(o, st)
    _finish(st, rig, _mat("Stripe_00_CLOTH_NOLINE", S.get("color", "#9a2c24")))
    return st


def _copy_weights(src, dst, only=None):
    """each new vertex takes the bone weights of the nearest vertex of src (only: a test on the group names the
    source vertices must carry, e.g. the feet's bones for a shoe)"""
    from mathutils.kdtree import KDTree
    mw = src.matrix_world
    names0 = {g.index: g.name for g in src.vertex_groups}
    use = [v for v in src.data.vertices if only is None or any(only(names0[g.group]) and g.weight > 0.3 for g in v.groups)]
    kd = KDTree(len(use))
    for v in use: kd.insert(mw @ v.co, v.index)
    kd.balance()
    names = {g.index: g.name for g in src.vertex_groups}
    groups = {}
    dmw = dst.matrix_world
    for v in dst.data.vertices:
        _, i, _ = kd.find(dmw @ v.co)
        for g in src.data.vertices[i].groups:
            nm = names[g.group]
            if only is not None and not only(nm): continue
            if nm not in groups: groups[nm] = dst.vertex_groups.new(name=nm)
            groups[nm].add([v.index], g.weight, "REPLACE")


def _bands(o, rig, G, z0, z1):
    """the elastic waistband and the cuffs: the garment's open edges turned in, so you never see into the shell"""
    bm = bmesh.new(); bm.from_mesh(o.data)
    edges = [e for e in bm.edges if e.is_boundary]
    if edges:
        ret = bmesh.ops.extrude_edge_only(bm, edges=edges)
        nv = [x for x in ret["geom"] if isinstance(x, bmesh.types.BMVert)]
        mw = o.matrix_world; inv = mw.inverted()
        for v in nv:
            p = mw @ v.co
            # inward toward the limb, a hem's thickness
            c = Vector((0.0, p.y, p.z)) if abs(p.z - z1) < abs(p.z - z0) else Vector((0.1 if p.x > 0 else -0.1, p.y + 0.0, p.z))
            d = (c - p); d.z = 0; d = d.normalized() if d.length > 1e-6 else d
            v.co = inv @ (p + d * G.get("hemDepth", 0.01) + Vector((0, 0, -0.004 if abs(p.z - z1) < abs(p.z - z0) else 0.004)))
    bm.to_mesh(o.data); bm.free()
    return []


def _drape(o, body, iters, margin, mask=None):
    """cloth hangs over the body's bumps instead of hugging them (a windbreaker doesn't show the chest's shape): the
    shell is smoothed (Taubin: shrink then inflate, so it keeps its size), then anything that sank into the body is
    pushed back out to margin. mask(p) 0..1 says how much each point may move (edges and cuffs stay put)"""
    import numpy as np
    bvh = _surface_bvh(body)
    mw = o.matrix_world; inv = mw.inverted(); me = o.data
    co = np.array([tuple(mw @ v.co) for v in me.vertices])
    w = np.array([mask(Vector(c)) if mask else 1.0 for c in co])
    bm = bmesh.new(); bm.from_mesh(me)
    nb = [[] for _ in range(len(co))]; edge = np.zeros(len(co), bool)
    for e in bm.edges:
        a, b = e.verts[0].index, e.verts[1].index; nb[a].append(b); nb[b].append(a)
        if e.is_boundary: edge[a] = edge[b] = True
    bm.free()
    w[edge] = 0.0
    live = np.where(w > 0)[0]
    for _ in range(iters):
        for lam in (0.5, -0.52):
            avg = np.array([co[nb[i]].mean(0) for i in live])
            co[live] += (lam * w[live])[:, None] * (avg - co[live])
    for i in live:
        p = Vector(co[i]); loc, n, _, d = bvh.find_nearest(p)
        if loc is None: continue
        if (p - loc).dot(n) < 0 or d < margin: co[i] = tuple(loc + n * margin) if n.dot(p - loc) >= 0 or True else co[i]
    for i, v in enumerate(me.vertices): v.co = inv @ Vector(co[i])


def _hang(o, G, hemZ, neckZ):
    """a loose top falls straight down from the chest (and the shoulder blades) instead of following the body in
    under them: each point on the front may not sit further back than the cloth above it allows (a slope of `hangSlope`
    back per metre down); the back the same, mirrored"""
    import numpy as np
    mw = o.matrix_world; inv = mw.inverted(); me = o.data
    co = np.array([tuple(mw @ v.co) for v in me.vertices])
    slope = G.get("hangSlope", 0.12); half = G.get("hangHalf", 0.16); cell = 0.012
    torso = (np.abs(co[:, 0]) < half) & (co[:, 2] < neckZ - 0.08) & (co[:, 2] > hemZ - 0.02)
    order = np.argsort(-co[:, 2])
    for sgn in (-1, 1):                       # -1: the front (faces -y), +1: the back
        best = {}                             # column -> (y limit at its z, z)
        for i in order:
            x, y, z = co[i]
            if not torso[i] or (y - co[torso][:, 1].mean()) * sgn < 0: continue
            col = int(round(x / cell))
            lim = None
            for c in (col - 1, col, col + 1):
                if c in best:
                    yb, zb = best[c]; l = yb - sgn * slope * (zb - z)
                    lim = l if lim is None else (min(lim, l) if sgn < 0 else max(lim, l))
            if lim is not None and (y - lim) * sgn < 0:
                # (eased toward the hem's band so the elastic still pulls in)
                k = _ss((z - hemZ) / max(1e-6, G.get("band", 0.045) * 1.5))
                co[i, 1] = y + (lim - y) * k
            y = co[i, 1]
            if col not in best or (y - best[col][0]) * sgn > 0 or True:
                prev = best.get(col)
                if prev is None or (y - (prev[0] - sgn * slope * (prev[1] - z))) * sgn >= 0: best[col] = (y, z)
    for i, v in enumerate(me.vertices): v.co = inv @ Vector(co[i])


def _group_w(o, names):
    """per vertex: the summed weight of the named vertex groups"""
    idx = {g.index for g in o.vertex_groups if g.name in names}
    return [sum(g.weight for g in v.groups if g.group in idx) for v in o.data.vertices]


def _arm_axis(B, side):
    return [B[f"upperarm_{side}"][0], B[f"lowerarm_{side}"][0], B[f"hand_{side}"][0]]


def top(body, rig, G, B, out):
    """a top (tee, jacket): neck to the hem round the hips, down the arms to the sleeve's end; eased out from the
    spine's line on the body and from each arm's bone line on the sleeves, blended by how much the arm carries a point"""
    hipZ = (B["thigh_l"][0].z + B["thigh_r"][0].z) / 2
    hemZ = hipZ + G.get("hem", 0.05)
    neckZ = B["neck_01"][0].z + G.get("neck", 0.0)
    arms = {s: _arm_axis(B, s) for s in ("l", "r")}
    arm_len = {s: (arms[s][1] - arms[s][0]).length + (arms[s][2] - arms[s][1]).length for s in arms}
    sleeve = G.get("sleeve", 1.0)          # 1 = to the wrist, 0.3 = a tee's short sleeve
    def along(p, s):
        a = arms[s]; q, t = _axis_point(p, a)
        L = 0.0 if t < 1 else (a[1] - a[0]).length
        seg = int(min(1, math.floor(t))); k = t - seg
        x = (a[seg + 1] - a[seg]).length * k + (0 if seg == 0 else (a[1] - a[0]).length)
        return x / arm_len[s], (p - a[0]).dot((a[1] - a[0]).normalized())
    def keep(p, i):
        if p.z < hemZ: return False
        s = "l" if p.x > 0 else "r"
        f, ax = along(p, s)
        if ax > 0.0:                                 # out along the arm, past the shoulder joint
            a = arms[s]
            if (p - a[2]).dot((a[2] - a[1]).normalized()) > -0.004: return False   # (the hand stays bare)
            return f <= sleeve
        return p.z <= neckZ
    o = _copy_region(body, keep, G.get("name", "Top"), G.get("subdiv", 1))
    warm = _group_w(o, {f"{b}_{s}" for b in ("upperarm", "lowerarm", "hand", "upperarm_twist_01", "lowerarm_twist_01") for s in ("l", "r")})
    ease_b = G.get("ease", [0.03, 0.035, 0.03])           # body: hem -> chest -> neck
    ease_a = G.get("sleeveEase", [0.025, 0.03])          # sleeve: shoulder -> end
    hem_band = G.get("band", 0.045); cuff = G.get("cuff", 0.04)
    pel = B["pelvis"][0]; spine = [Vector((pel.x, pel.y, hemZ - 0.1)), B["spine_02"][0], B["neck_01"][0]]
    mw = o.matrix_world; inv = mw.inverted()
    for v, wa in zip(o.data.vertices, warm):
        p = mw @ v.co; s = "l" if p.x > 0 else "r"
        # body: out from the spine line (flattened front-back a little: a chest is wider than deep)
        q, _ = _axis_point(p, spine); d = p - q; d.z = 0
        d = d.normalized() if d.length > 1e-6 else Vector((0, -1, 0))
        t = (p.z - hemZ) / max(1e-6, neckZ - hemZ); e = _lerp_list(ease_b, t)
        if p.z < hemZ + hem_band:              # elastic hem: snug band, the cloth above it bloused out
            c = (p.z - hemZ) / hem_band; e = G.get("bandEase", 0.012) + (e + G.get("blouse", 0.015) - G.get("bandEase", 0.012)) * _ss(c * 1.5)
        if p.z > neckZ - 0.04: e *= 0.5 + 0.5 * _ss((neckZ - p.z) / 0.04)
        disp_b = d * e
        # sleeve: out from the arm's bone line
        qa, _ = _axis_point(p, arms[s]); da = p - qa
        da = da.normalized() if da.length > 1e-6 else Vector((0, 0, 1))
        f, _ = along(p, s); ea = _lerp_list(ease_a, min(1, f / max(1e-6, sleeve)))
        if sleeve > 0.8 and f > sleeve - cuff / arm_len[s]:
            c = (sleeve - f) * arm_len[s] / cuff; ea = G.get("cuffEase", 0.006) + (ea + G.get("puff", 0.012) - G.get("cuffEase", 0.006)) * _ss(c * 1.6)
        # folds: rings round the sleeve, soft
        ea += G.get("folds", 0.004) * math.sin(2 * math.pi * f * arm_len[s] / G.get("foldLen", 0.05) + 2 * math.atan2(da.z, da.y))
        disp_a = da * ea
        w = _ss(wa)
        v.co = inv @ (p + disp_b * (1 - w) + disp_a * w)
    if G.get("hang", True):
        _hang(o, G, hemZ, neckZ)
    if G.get("drape", 0):
        # (the body hangs from the shoulders: the torso drapes, the sleeves keep their folds, the shoulders stay)
        _drape(o, body, G["drape"], G.get("dropMargin", 0.008),
               lambda p: (1 - _ss((abs(p.x) - 0.12) / 0.05)) * _ss((neckZ - 0.06 - p.z) / 0.08))
    _finish(o, rig, _mat(G.get("mat", "Top_00_CLOTH"), G.get("color", "#26304f")))
    _bands(o, rig, G, hemZ, neckZ)
    parts = [o]
    if G.get("collar"): parts.append(_collar(o, rig, G, neckZ))
    if G.get("zip"): parts.append(_zip(o, rig, G, hemZ, neckZ))
    out.extend(parts)
    print("clothes: top", len(o.data.vertices), "verts, hem", round(hemZ, 3), "neck", round(neckZ, 3))


def _collar(o, rig, G, neckZ):
    """a stand collar: the neckline's edge loop grown up and slightly out"""
    h = G.get("collar", 0.045)
    bm = bmesh.new(); bm.from_mesh(o.data); mw = o.matrix_world; inv = mw.inverted()
    edges = [e for e in bm.edges if e.is_boundary and all((mw @ v.co).z > neckZ - 0.06 for v in e.verts)]
    ret = bmesh.ops.extrude_edge_only(bm, edges=edges)
    nv = [x for x in ret["geom"] if isinstance(x, bmesh.types.BMVert)]
    cen = sum(((mw @ v.co) for v in nv), Vector()) / max(1, len(nv))
    for v in nv:
        p = mw @ v.co; d = p - cen; d.z = 0; d = d.normalized() if d.length > 1e-6 else d
        v.co = inv @ (p + Vector((0, 0, h)) + d * G.get("collarFlare", 0.008))
    bm.to_mesh(o.data); bm.free()
    return o


def _zip(o, rig, G, z0, z1):
    """the zip: a thin grey ribbon down the centre front"""
    bvh = _surface_bvh(o); bm = bmesh.new(); rows = []; w = G.get("zipW", 0.006)
    for k in range(41):
        z = z0 + 0.01 + (z1 + G.get("collar", 0) - z0 - 0.02) * k / 40
        hit = bvh.ray_cast(Vector((0, -0.6, z)), Vector((0, 1, 0)))
        if hit[0] is None: continue
        pt = hit[0] + Vector((0, -0.0015, 0)); rows.append((pt - Vector((w / 2, 0, 0)), pt + Vector((w / 2, 0, 0))))
    vs = [(bm.verts.new(a), bm.verts.new(b)) for a, b in rows]
    for i in range(len(vs) - 1):
        f = bm.faces.new((vs[i][0], vs[i][1], vs[i + 1][1], vs[i + 1][0]))
        if f.normal.y > 0: f.normal_flip()
    me = bpy.data.meshes.new("Zip"); bm.to_mesh(me); bm.free()
    z = bpy.data.objects.new("Zip", me); bpy.context.scene.collection.objects.link(z)
    _copy_weights(o, z); _finish(z, rig, _mat("Zip_00_CLOTH_NOLINE", G.get("zipColor", "#8a8f99")))
    return z


def shoes(body, rig, G, B, out):
    """sneakers: a convex hull round the foot (a shoe hides the toes and the foot's bones), smoothed into a rounded
    last, a little longer and wider than the foot, flat underneath, the bottom part in the sole's colour"""
    for s in ("l", "r"):
        ankle = B[f"foot_{s}"][0]; topZ = ankle.z + G.get("top", 0.03)
        mw = body.matrix_world
        pts = [mw @ v.co for v in body.data.vertices if (mw @ v.co).z <= topZ and ((mw @ v.co).x > 0) == (s == "l")]
        cx = sum(pts, Vector()) / len(pts)
        bm = bmesh.new()
        for p in pts:
            q = p.copy(); d = q - Vector((cx.x, cx.y, q.z))
            q += Vector((d.x * G.get("widen", 0.25), d.y * G.get("lengthen", 0.14), 0))
            q.z = max(0.0, q.z)
            bm.verts.new(q)
        bmesh.ops.convex_hull(bm, input=bm.verts)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
        me = bpy.data.meshes.new(f"Shoe_{s}"); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new(f"Shoe_{s}", me); bpy.context.scene.collection.objects.link(o)
        bpy.context.view_layer.objects.active = o
        # remesh to even quads, then smooth: a hull's long thin triangles shade in streaks
        rm = o.modifiers.new("re", "REMESH"); rm.mode = "SMOOTH"; rm.octree_depth = 6; rm.use_smooth_shade = True
        bpy.ops.object.modifier_apply(modifier="re")
        sm = o.modifiers.new("sm", "SMOOTH"); sm.iterations = G.get("smooth", 2); sm.factor = 0.5
        bpy.ops.object.modifier_apply(modifier="sm")
        sole = G.get("sole", 0.02)
        for v in o.data.vertices:
            if v.co.z < 0.004: v.co.z = 0.0
        o.data.materials.append(_mat(G.get("mat", "Shoes_00_CLOTH"), G.get("color", "#ece4d2")))
        o.data.materials.append(_mat(G.get("soleMat", "Sole_00_CLOTH"), G.get("soleColor", "#f7f4ec")))
        for poly in o.data.polygons:
            poly.use_smooth = True
            if poly.center.z < sole: poly.material_index = 1
        # bone weights: the foot and toe bones by height along the foot
        _copy_weights(body, o, only=lambda gname: gname.startswith(("foot_", "ball_", "calf_")))
        o.parent = rig; mod = o.modifiers.new("Armature", "ARMATURE"); mod.object = rig
        out.append(o)
    print("clothes: shoes")


def build_clothes(body, rig, specs):
    B = _bones(rig); out = []
    for G in specs:
        if G["type"] == "pants": pants(body, rig, G, B, out)
        elif G["type"] == "top": top(body, rig, G, B, out)
        elif G["type"] == "shoes": shoes(body, rig, G, B, out)
        else: print("clothes: unknown type", G["type"])
    return out
