"""Our own anime hair generator (stage 3 of the own-character pipeline): hair grown as solid clumps from the scalp of a
build_body.py head, by recipe, no hand modelling.

    spec["hair"] = { "style": "spiky" | "wavy", "color": "#c8a064", "n": 110, "len": [0.05, 0.08], "w": 0.034,
                     "front": 0.055, "nape": -0.075, "fringe": 0.012, "endZ": -0.21, "seed": 1, ... }

How it is built (the anime way: VRoid, Guilty Gear and Genshin hair is a few dozen big solid locks with an ink line
round each, never strands):
- a CAP: the scalp above the hairline copied and pushed out a few mm, so no skin shows between the locks;
- CLUMPS: a root on the scalp every few cm (an even spread over the hair region), each grown as a tapered tube with a
  flat, lens-like cross-section. A lock flows away from the crown (the whorl at the top of the back of the head) along
  the skull, kept a few mm off it; gravity bends it down the further it gets. "spiky": short, tips flare out and up.
  "wavy": long, the side-to-side wave grows toward the tip, the ends curl in;
- the front locks (bangs) stop just above the eyes, so the face stays open;
- long locks get a bone chain each (spring bones in the VRM, so the engine swings them; head/neck colliders).
Every number comes from the recipe and a seed: the same recipe always gives the same hair.
"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree


def _hex(h):
    h = h.lstrip("#"); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def _mat(name, colour):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*[x ** 2.2 for x in _hex(colour)], 1)
    return m


def _world_bvh(body):
    mw = body.matrix_world; me = body.data
    V = [mw @ v.co for v in me.vertices]
    return BVHTree.FromPolygons(V, [list(p.vertices) for p in me.polygons]), V


def _smooth01(x):
    x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)


class Head:
    """the head as seen by the hair: its centre, the hairline and the scalp surface (all in world space)"""

    def __init__(self, body, eyes, H):
        self.bvh, self.V = _world_bvh(body)
        (lc, _), (rc, _) = eyes["l"], eyes["r"]
        self.eyeZ = (lc[2] + rc[2]) / 2; self.eyeY = (lc[1] + rc[1]) / 2
        self.C = Vector((0.0, self.eyeY + H.get("skullBack", 0.06), self.eyeZ + H.get("skullUp", 0.02)))
        self.H = H
        # the crown (whorl): up and back from the centre
        el, az = math.radians(H.get("crownEl", 62)), math.radians(H.get("crownAz", 180))
        self.K = self.surface(Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))))[0]

    def surface(self, d):
        """the outermost scalp point straight out from the centre along d, and its normal"""
        d = d.normalized(); far = self.C + d * 0.35
        hit = self.bvh.ray_cast(far, -d)
        if hit[0] is None: return self.C + d * 0.09, d
        n = hit[1]
        if n.dot(d) < 0: n = -n
        return hit[0], n

    def hairline_z(self, az):
        """the hairline height (world z) round the head: forehead in front, above the ears at the side, nape behind"""
        H = self.H; a = abs(math.degrees(az))
        front, side, back = self.eyeZ + H.get("front", 0.055), self.eyeZ + H.get("side", 0.01), self.eyeZ + H.get("nape", -0.075)
        if a <= 50: return front
        if a <= 95: return front + (side - front) * _smooth01((a - 50) / 45)
        return side + (back - side) * _smooth01((a - 95) / 60)

    def cap_off(self, p):
        """how far the hair's mass (the cap) stands off the scalp at p: thin at the hairline, capBulk higher up"""
        d = p - self.C; hz = self.hairline_z(math.atan2(d.x, -d.y))
        return self.H.get("cap", 0.004) + self.H.get("capBulk", 0.012) * _smooth01((p.z - hz) / self.H.get("capRamp", 0.045))

    def in_hair(self, p):
        d = p - self.C; az = math.atan2(d.x, -d.y)
        return p.z > self.hairline_z(az)

    def keep_out(self, p, gap):
        """p pushed out of the head to at least gap off its surface"""
        loc, n, i, dist = self.bvh.find_nearest(p)
        if loc is None: return p
        out = p - loc
        if out.dot(n) < 0: return loc + n * gap          # inside: back out along the surface normal
        if dist < gap: return loc + n * gap
        return p


def _roots(head, n, rnd):
    """an even spread of root directions over the hair region (a Fibonacci sphere, the region's points kept)"""
    pts = []; N = n * 3
    for i in range(N):
        z = 1 - 2 * (i + 0.5) / N; r = math.sqrt(max(0, 1 - z * z)); a = i * math.pi * (3 - math.sqrt(5))
        d = Vector((r * math.cos(a), r * math.sin(a), z))
        p, nrm = head.surface(d)
        if head.in_hair(p): pts.append((p, nrm))
    rnd.shuffle(pts)
    # keep n of them, spread evenly (farthest-point picking)
    if len(pts) <= n: return pts
    keep = [pts[0]]; dmin = [(q[0] - pts[0][0]).length for q in pts]
    while len(keep) < n:
        j = max(range(len(pts)), key=lambda k: dmin[k]); keep.append(pts[j])
        dmin = [min(dmin[k], (pts[k][0] - pts[j][0]).length) for k in range(len(pts))]
    return keep


def _grow(head, root, nrm, H, rnd, is_front):
    """one lock's centre line: [(point, normal-ish side, width factor)], from the root along the flow"""
    style = H.get("style", "spiky")
    L0, L1 = H.get("len", [0.05, 0.08]); L = rnd.uniform(L0, L1)
    if style == "wavy" and not is_front: L = H.get("longLen", 0.26) * rnd.uniform(0.85, 1.1)
    K = H.get("steps", 14 if style == "spiky" else 26); ds = L / K
    gap = H.get("lift", 0.006); flare = H.get("flare", 0.55); grav = H.get("gravity", 0.35 if style == "spiky" else 0.9)
    amp, lam = H.get("wave", [0.009, 0.07]); ph = rnd.uniform(0, 6.28)
    fringe = head.eyeZ + H.get("fringe", 0.012); endZ = head.eyeZ + H.get("endZ", -0.21)
    # a different cut at the sides (over the ears) than at the back: blended by where round the head the root is
    if "endZside" in H:
        d0 = root - head.C; a = abs(math.degrees(math.atan2(d0.x, -d0.y)))
        k = _smooth01((a - 60) / 30) * (1 - _smooth01((a - 125) / 30))
        endZ = endZ + (head.eyeZ + H["endZside"] - endZ) * k
    p = root - nrm * 0.004; pts = [p.copy()]; flow_prev = None
    for k in range(1, K + 1):
        s = k / K
        loc, n, _, _ = head.bvh.find_nearest(p)
        n = n if n is not None else nrm
        if n.dot(p - head.C) < 0: n = -n
        away = p - head.K; t = away - n * away.dot(n)
        if t.length < 1e-4: t = Vector((0, 0, -1)) - n * (-n.z)
        t.normalize()
        if flow_prev is not None: t = (t + flow_prev * 1.5).normalized()   # (no sudden turns)
        d = t
        d = (d + Vector((0, 0, -1)) * grav * s * s).normalized()
        if style == "spiky":
            # the tip lifts off the head: out along the normal and a little up (the messy upswept look)
            k_out = _smooth01((s - 0.35) / 0.65) * flare
            d = (d * (1 - k_out) + (n + Vector((0, 0, H.get("up", 0.35)))).normalized() * k_out).normalized()
        flow_prev = d
        p = p + d * ds
        if style == "wavy" and not is_front:
            # the wave: a side-to-side offset growing toward the tip (the step adds the change of the offset)
            side = n.cross(d).normalized(); s0 = (k - 1) / K
            o = lambda x: amp * x * math.sin(ph + 2 * math.pi * x * L / lam)
            p = p + side * (o(s) - o(s0))
            # the ends flick out (soft layered ends on the sheet)
            if s > 0.75: p = p + n * (H.get("tipOut", 0.006) * (s - 0.75) / 0.25)
        # volume: the lock stands off the skull most in its middle (anime hair is big; a lock pasted to the scalp reads bald)
        # the lock lies in the cap's mass: its root buried under the cap's surface, rising out of it toward the tip
        lift = head.cap_off(p) - H.get("bury", 0.008) * (1 - s) + gap * s \
            + H.get("bulk", 0.0) * math.sin(math.pi * min(1.0, s * 1.4))
        p = head.keep_out(p, lift)
        # the face stays open: a side lock that drifts in front of the cheeks is moved out beside them
        if not is_front and p.y < head.eyeY + 0.03 and p.z < head.eyeZ + 0.05:
            fh = H.get("faceHalf", 0.058) + (0.0 if p.z > head.eyeZ - 0.06 else 0.006)
            if abs(p.x) < fh: p.x = math.copysign(fh, p.x if abs(p.x) > 1e-4 else root.x)
        pts.append(p.copy())
        if is_front and p.z < fringe: break
        if p.z < endZ: break
    return pts


def _tube(bm, pts, head, w0, thick, taper_p, style, rnd, dvert_layer=None, weights=None):
    """a tapered tube with a lens cross-section along pts; returns the new verts"""
    M = 8; rings = []; out = []
    n_pts = len(pts)
    for i, p in enumerate(pts):
        s = i / (n_pts - 1)
        a = pts[min(i + 1, n_pts - 1)] - pts[max(i - 1, 0)]; a.normalize()
        loc, n, _, _ = head.bvh.find_nearest(p)
        n = (p - loc).normalized() if loc is not None and (p - loc).length > 1e-5 else (p - head.C).normalized()
        n = (n - a * n.dot(a)).normalized(); b = a.cross(n).normalized()
        if style == "spiky": w = w0 * (1 - s) ** taper_p
        else: w = w0 * (1 - s ** 2.2) ** taper_p * (1 + 0.15 * math.sin(math.pi * s))
        w = max(w, 0.0)
        if i == n_pts - 1:
            v = bm.verts.new(p); rings.append([v]); out.append((v, i)); continue
        ring = []
        for j in range(M):
            ang = 2 * math.pi * j / M
            # lens: wide along b, thin along n; the outside (n>0) fuller than the side against the head
            x, y = math.cos(ang), math.sin(ang)
            yy = y * (thick if y > 0 else thick * 0.55)
            v = bm.verts.new(p + b * (x * w / 2) + n * (yy * w / 2)); ring.append(v); out.append((v, i))
        rings.append(ring)
    for i in range(len(rings) - 1):
        A, B = rings[i], rings[i + 1]
        for j in range(M):
            # (wound so the faces look outward: inside-out tubes drew dark with ink specks)
            if len(B) == 1: bm.faces.new((B[0], A[(j + 1) % M], A[j]))
            else: bm.faces.new((B[j], B[(j + 1) % M], A[(j + 1) % M], A[j]))
    bm.faces.new(rings[0])
    return out


def build_hair(body, rig, eyes, H):
    rnd = random.Random(H.get("seed", 1))
    head = Head(body, eyes, H)
    style = H.get("style", "spiky")
    bm = bmesh.new(); locks = []
    roots = _roots(head, H.get("n", 110), rnd)
    for (p, nrm) in roots:
        d = p - head.C; az = math.degrees(math.atan2(d.x, -d.y))
        is_front = abs(az) < H.get("bangsAz", 55) and p.z < head.eyeZ + H.get("bangsBelow", 0.2)
        pts = _grow(head, p, nrm, H, rnd, is_front)
        if len(pts) < 3: continue
        w0 = H.get("w", 0.034) * rnd.uniform(0.8, 1.2) * (H.get("bangsW", 0.85) if is_front else 1)
        vs = _tube(bm, pts, head, w0, H.get("thick", 0.5), H.get("taper", 0.9 if style == "spiky" else 0.6), style, rnd)
        locks.append((pts, vs, is_front))
    # the cap: the scalp above the hairline, pushed out
    capT = H.get("cap", 0.004)
    mw = body.matrix_world; me = body.data; Vw = head.V
    cap_faces = [p for p in me.polygons if head.in_hair(mw @ p.center)
                 and (mw @ p.center - head.C).length < 0.16]
    used = {}
    capbm = bmesh.new()
    for p in cap_faces:
        vs = []
        for vi in p.vertices:
            if vi not in used:
                q = Vw[vi]; loc, n, _, _ = head.bvh.find_nearest(q)
                # the cap is the hair's mass: thin at the hairline, swelling to capBulk higher up, so the locks'
                # roots sink into it and only their free parts show (one mass with locks, not a pile of scales)
                t = head.cap_off(q)
                used[vi] = capbm.verts.new(q + (n if n.dot(q - head.C) > 0 else -n) * t)
            vs.append(used[vi])
        try: capbm.faces.new(vs)
        except ValueError: pass
    bm.verts.index_update(); locks = [(pts, [(v.index, i) for v, i in vs], f) for pts, vs, f in locks]
    hair_me = bpy.data.meshes.new("Hair"); bm.to_mesh(hair_me); bm.free()
    cap_me = bpy.data.meshes.new("HairCap"); capbm.to_mesh(cap_me); capbm.free()
    hair = bpy.data.objects.new("Hair", hair_me); cap = bpy.data.objects.new("HairCap", cap_me)
    for o in (hair, cap): bpy.context.scene.collection.objects.link(o)
    for o in (hair, cap):
        for poly in o.data.polygons: poly.use_smooth = True
    hair.data.materials.append(_mat("Hair_00_HAIR", H.get("color", "#c8a064")))
    cap.data.materials.append(_mat("HairCap_00_HAIR", H.get("capColor", H.get("shade", H.get("color", "#c8a064")))))
    # rigid on the head; long locks get springs
    springs = []
    for o in (hair, cap):
        g = o.vertex_groups.new(name="head"); g.add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    if H.get("springs", style == "wavy"):
        springs = _spring_chains(hair, rig, locks, H)
    for o in (hair, cap):
        o.parent = rig; mod = o.modifiers.new("Armature", "ARMATURE"); mod.object = rig
    print("hair:", style, len(locks), "locks,", sum(1 for l in locks if l[2]), "bangs, cap", len(cap_faces), "faces, springs", len(springs))
    # where the hair must not go, in the world: the skull, and the face (a ball sunk behind the face's front, so a lock
    # swinging round in a quick turn slides over the cheeks instead of through them)
    H["_colliders"] = [("head", head.C.copy(), H.get("headR", 0.09)),
                       ("head", Vector((0.0, head.eyeY + H.get("faceBack", 0.04), head.eyeZ - 0.03)), H.get("faceR", 0.062))]
    return [hair, cap], springs


def _spring_chains(hair, rig, locks, H):
    """a bone chain down each long lock (every few cm), its vertices weighted along it; the chains are returned for the
    VRM spring setup"""
    seg = H.get("boneLen", 0.045); chains = []
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    eb = rig.data.edit_bones; head_b = eb["head"]
    plans = []
    for li, (pts, vs, is_front) in enumerate(locks):
        Ltot = sum((pts[i + 1] - pts[i]).length for i in range(len(pts) - 1))
        if Ltot < H.get("springMin", 0.09): continue
        # bone joints spaced along the lock
        cum = [0.0]
        for i in range(len(pts) - 1): cum.append(cum[-1] + (pts[i + 1] - pts[i]).length)
        nb = max(2, int(Ltot / seg)); marks = [Ltot * k / nb for k in range(nb + 1)]
        def at(x):
            for i in range(len(cum) - 1):
                if cum[i + 1] >= x: k = (x - cum[i]) / max(1e-9, cum[i + 1] - cum[i]); return pts[i].lerp(pts[i + 1], k)
            return pts[-1]
        joints = [at(x) for x in marks]
        names = []; parent = head_b
        for k in range(nb):
            b = eb.new(f"hair_{li:03d}_{k}"); b.head = joints[k]; b.tail = joints[k + 1]; b.parent = parent
            b.use_connect = k > 0; names.append(b.name); parent = b
        plans.append((li, names, cum, marks))
    bpy.ops.object.mode_set(mode="OBJECT")
    # weights: each vertex of the lock split between the two bones round its place along the lock (the first bit
    # stays on the head)
    groups = {}
    for li, names, cum, marks in plans:
        pts, vs, _ = locks[li]; Ltot = marks[-1]; nb = len(names)
        for (v, i) in vs:
            x = cum[min(i, len(cum) - 1)]; f = x / Ltot * nb - 0.5
            k0 = max(0, min(nb - 1, int(math.floor(f)))); k1 = min(nb - 1, k0 + 1); t = min(1, max(0, f - k0))
            root_k = _smooth01(x / max(1e-6, marks[1]))       # the root itself is fixed to the head
            ws = {names[k0]: (1 - t) * root_k, names[k1]: t * root_k}
            ws["head"] = 1 - root_k
            for gname, w in ws.items():
                if w <= 0: continue
                if gname not in groups: groups[gname] = hair.vertex_groups.get(gname) or hair.vertex_groups.new(name=gname)
                groups[gname].add([v], w, "REPLACE")
        chains.append(names)
    return chains


def bind_springs(rig, chains, H):
    """the VRM 1.0 spring setup for the hair chains: one spring per lock, colliders on the head, neck and chest"""
    ctx = bpy.context; sb = rig.data.vrm_addon_extension.spring_bone1
    def collider(bone, r, offset=(0, 0, 0), tail=None):
        c = sb.add_collider(ctx, rig); c.node.bone_name = bone
        if tail is None:
            c.shape_type = "Sphere"; c.shape.sphere.radius = r; c.shape.sphere.offset = offset
        else:
            c.shape_type = "Capsule"; c.shape.capsule.radius = r; c.shape.capsule.offset = offset; c.shape.capsule.tail = tail
        c.reset_bpy_object(ctx, rig)
        return c
    # (offsets in the bone's own space: y runs along the bone, up the head)
    def local(bone, world):
        # a world point in the bone's own space (the collider offsets are bone-relative)
        return tuple((rig.data.bones[bone].matrix_local.inverted() @ rig.matrix_world.inverted() @ world))
    cols = [collider(b, r, local(b, w)) for (b, w, r) in H.get("_colliders", [])] + [
            collider("neck_01", 0.05, (0, 0, 0), (0, 0.09, 0)),
            collider("spine_03", 0.12, (0, 0.08, 0.02))]
    grp = sb.add_collider_group(); grp.vrm_name = "head"
    for c in cols:
        r = grp.add_collider(); r.collider_uuid = c.uuid
    for names in chains:
        # the upper part of a lock rides with the head (bones there are not spring joints): a lock pivoting at the
        # scalp swung right across the face in a quick turn; hair moves most toward its ends
        k0 = min(len(names) - 2, int(len(names) * H.get("springFrom", 0.45)))
        names = names[max(0, k0):]
        s = sb.add_spring(); s.vrm_name = names[0]
        for nm in names:
            j = s.add_joint(); j.node.bone_name = nm
            j.stiffness = H.get("stiff", 1.2); j.gravity_power = H.get("gpow", 0.4); j.drag_force = H.get("drag", 0.45); j.hit_radius = 0.015
        g = s.add_collider_group(); g.collider_group_uuid = grp.uuid
