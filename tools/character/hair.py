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
import bpy, bmesh, math, random, zlib
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
    if H.get("zones"): return build_hair_v2(body, rig, eyes, H)
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


# ---------------------------------------------------------------- v2: designed by zone (8 Nov 2026)
# research "Human looking anime character design" + "Anime character tutorials" (research/ in the project files): anime
# hair is a few dozen big pieces in a big-medium-small hierarchy, placed by zone (nape, back, sides, temples, top tufts,
# fringe, crown / under-sheets, back sheets, sides, parted bangs, wisps, ahoge), never an even spread of equal locks (a
# pine cone; dreadlocks when long). The tutorials build each piece as one continuous body whose END splits into points
# (V-notches between them), never strand by strand. A piece starts at the whorl or the part, runs the short way round the
# head on a volume that stands off the skull (top 3 cm, back 2.5-3), leaves it at its zone's height and ends in a free
# part lifted off the volume along the flow (never straight out like sun rays). Spikes have a diamond section with a
# ridge, sheets a thin crescent bent round the head; long hair waves per sheet, neighbours a little out of phase; normals
# come from the volume on the bodies (the hair shades as one ball) and from the piece on the tips (each spike gets a lit
# and a shaded side). The ink weight per vertex goes out in the UVs: the engine inks only the silhouette and free tips.
#
#   spec["hair"]["zones"] = [ { "name", "count": [P, S, A], "w": [wP, wS, wA], "rootAz": [a0, a1], "rootEl": [e0, e1],
#       "az": [t0, t1] (where the pieces end up, degrees, 0 = front, +90 = the character's left), "hug": z (m, from the
#       eyes) where a piece leaves the volume, "len" (or: stop after this much volume), "tip": free length (m),
#       "mode": "spike" | "hang" | "bang", "flare", "up" (+ "flareJ", "upJ"), "hook", "sweep", "cut" (hang: z of the
#       ends), "layer", "under": true (darker material), "wedge" (width at the root), "taper",
#       "split": [n0, n1] points per piece, "splitD" (share of the free part split), "fan", "cover", "tipHook",
#       "tipLift", "tipTaper", "section" / "tipSection": "diamond" | "crescent" | "lens" } ]
#   spec["hair"]["vol"] = { "top", "side", "back", "nape", "front" } (m off the scalp); "normalK" / "tipNormalK"
def _dir(az, el):
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def _slerp(u0, u1, t):
    c = max(-1.0, min(1.0, u0.dot(u1))); w = math.acos(c)
    if w < 1e-5: return u0.copy()
    return ((u0 * math.sin((1 - t) * w) + u1 * math.sin(t * w)) / math.sin(w)).normalized()


class Volume:
    """the hair's mass round the head: how far it stands off the scalp in each direction, thin at the hairline"""

    def __init__(self, head, H):
        self.h = head; V = H.get("vol", {})
        self.top, self.side, self.back = V.get("top", 0.022), V.get("side", 0.014), V.get("back", 0.027)
        self.nape, self.front = V.get("nape", 0.005), V.get("front", 0.008)
        self.ramp = V.get("ramp", 0.04)
        rnd = random.Random(H.get("seed", 1) * 7 + 3)
        self.lobes = [(rnd.uniform(0, 6.28), rnd.uniform(0, 6.28)) for _ in range(3)]
        self.noise = V.get("noise", 0.15)

    def off(self, p):
        d = (p - self.h.C).normalized(); up, back, side = d.z, d.y, abs(d.x)
        w = {"top": max(up, 0) ** 2, "back": max(back, 0) ** 2 * (1 - max(-up, 0)), "side": side ** 2,
             "front": max(-back, 0) ** 2, "nape": max(-up - 0.05, 0) ** 2 * max(back + 0.2, 0) * 3}
        tot = sum(w.values()) + 1e-6
        o = sum(w[k] * getattr(self, k) for k in w) / tot
        az = math.atan2(d.x, -d.y)
        o *= 1 + self.noise * sum(math.sin(az * (i + 2) + a) * math.cos(math.asin(max(-1, min(1, up))) * (i + 1) + b) for i, (a, b) in enumerate(self.lobes)) / 3
        hz = self.h.hairline_z(az)
        return o * _smooth01((p.z - hz) / self.ramp + 0.15)

    def scalp(self, u):
        """the skull straight out from the head centre along u (from inside, so an ear never counts as scalp)"""
        C = self.h.C; hit = self.h.bvh.ray_cast(C, u, 0.2)
        if hit[0] is not None and (hit[0] - C).length > 0.05: return hit[0]
        s, _ = self.h.surface(u)
        if (s - C).length > 0.15:      # (a low ray can meet the shoulders first: the nearest scalp instead)
            loc, _, _, _ = self.h.bvh.find_nearest(C + u * 0.1)
            if loc is not None: s = C + u * (loc - C).length
        return s

    def ray(self, u, lift=0.0):
        """the volume's point straight out from the head centre along u, lifted (radial: a path stepped round the head
        keeps its direction; offsetting along the scalp's face normals pulled every path sideways)"""
        s = self.scalp(u)
        return self.h.C + u * ((s - self.h.C).length + self.off(s) + lift), u

    def at(self, p, lift=0.0):
        return self.ray((p - self.h.C).normalized(), lift)


def _exit_el(vol, az, zt, lift):
    """the elevation where the volume, at azimuth az, comes down to height zt"""
    lo, hi = -85.0, 88.0
    for _ in range(20):
        m = (lo + hi) / 2
        if vol.ray(_dir(az, m), lift)[0].z > zt: hi = m
        else: lo = m
    return (lo + hi) / 2


def _path(head, vol, root_dir, Z, k, n_k, rnd, H):
    """one clump's centre line: [(point, normal)] from its root (buried in the volume) to its tip, the index where the
    free part starts, and the azimuth it ended at. On the volume it runs the short way round the head from its root to
    its exit (azimuth az_t, at height hug); the free part then leaves the volume along the flow (lifted off it by flare/up,
    never straight out like sun rays)"""
    mode = Z.get("mode", "spike")
    a0, a1 = Z["az"]; t = (k + 0.5) / n_k
    az_t = a0 + (a1 - a0) * t + rnd.uniform(-1, 1) * Z.get("azJ", 6)
    lift = Z.get("layer", 0) * 0.0022
    ds = 0.006
    hug = head.eyeZ + Z["hug"] + rnd.uniform(-1, 1) * Z.get("hugJ", 0.004)
    # (hugV: the zone's middle comes down further than its ends, the nape's V; metres at the middle)
    if Z.get("hugV"): hug -= Z["hugV"] * max(0.0, 1 - abs(az_t - (a0 + a1) / 2) / max(1e-6, abs(a1 - a0) / 2))
    u0 = root_dir.normalized(); u1 = _dir(az_t, _exit_el(vol, az_t, hug, lift))
    ang = math.acos(max(-1.0, min(1.0, u0.dot(u1))))
    nst = max(2, int(ang * 0.13 / ds))
    maxL = Z["len"] * rnd.uniform(1 - Z.get("lenJ", 0.15), 1) if "len" in Z else 1.0
    pts = []; travelled = 0.0
    for i in range(nst + 1):
        u = _slerp(u0, u1, i / nst)
        bury = 0.008 * (1 - _smooth01(travelled / 0.035))
        p, n = vol.ray(u, lift - bury)
        if pts: travelled += (p - pts[-1][0]).length
        pts.append((p, n))
        if travelled > maxL: break
    p, n = pts[-1]; d = (pts[-1][0] - pts[-2][0]).normalized(); i_free = len(pts) - 1
    side = d.cross(n).normalized()
    alt = 1 if k % 2 == 0 else -1
    # 2. the free part
    if mode == "spike" or mode == "bang":
        tj = Z.get("tipJ", 0.2); L = Z.get("tip", 0.03) * rnd.uniform(1 - tj, 1 + tj); steps = max(3, int(L / ds))
        sweep = Vector((Z.get("sweep", 0.0), 0, 0))
        hook = side * alt * Z.get("hook", 0.0) * rnd.uniform(0.6, 1.2)
        out = (n * (Z.get("flare", 0.4) + rnd.uniform(-1, 1) * Z.get("flareJ", 0.0))
               + Vector((0, 0, Z.get("up", 0.0) + rnd.uniform(-1, 1) * Z.get("upJ", 0.0))))
        for i in range(steps):
            s = (i + 1) / steps
            dd = (d + out * s + Vector((0, 0, -Z.get("drop", 0.0))) * s + sweep * Z.get("sweepK", 0.0) * s + hook * s).normalized()
            p = p + dd * ds
            p = head.keep_out(p, Z.get("float", 0.005) if mode == "bang" else 0.004)
            pts.append((p.copy(), n.copy()))
    elif mode == "hang":
        cut = head.eyeZ + Z["cut"] + rnd.uniform(-1, 1) * Z.get("cutJ", 0.01)
        spread = Z.get("spread", 0.25)
        r = Vector((p.x - head.C.x, p.y - head.C.y, 0)); r = r.normalized() if r.length > 1e-4 else Vector((0, 1, 0))
        while p.z > cut and len(pts) < 200:
            r = Vector((p.x - head.C.x, p.y - head.C.y, 0))
            r = r.normalized() if r.length > 1e-4 else Vector((0, 1, 0))
            g = (Vector((0, 0, -1)) + r * spread).normalized()
            d = (d * 0.75 + g * 0.25).normalized(); p = p + d * ds
            # the face window: the hair beside the face stays outside the outer eye corners (plus 10-20%)
            if p.y < head.eyeY + 0.035 and p.z < head.eyeZ + 0.03:
                fh = H.get("faceHalf", 0.055) + Z.get("w", [0.03])[0] * 0.5
                if abs(p.x) < fh: p.x = math.copysign(fh, p.x if abs(p.x) > 1e-4 else az_t)
            p = head.keep_out(p, Z.get("gap", 0.012))
            pts.append((p.copy(), r.copy()))
        # the ends flick outward (25-50 degrees over the last few cm)
        L = Z.get("flick", 0.03); steps = max(2, int(L / ds))
        for i in range(steps):
            s = (i + 1) / steps
            d = (d + r * Z.get("curl", 0.7) * s * 0.5).normalized(); p = head.keep_out(p + d * ds, Z.get("gap", 0.012))
            pts.append((p.copy(), r.copy()))
    return pts, az_t, i_free


def _waves(pts, head, Z, phase, H):
    """long hair waves in groups: a shared phase, straight at the top, growing toward the ends, mostly in and out"""
    amp, lam = H.get("wave", [0.012, 0.095]); z0 = head.eyeZ + Z.get("waveFrom", 0.0)
    out = []
    for i, (p, n) in enumerate(pts):
        if p.z >= z0 or i == 0: out.append((p, n)); continue
        k = min(1.0, (z0 - p.z) / 0.12)
        a = amp * k * math.sin(phase + 2 * math.pi * (z0 - p.z) / lam)
        b = amp * 0.4 * k * math.cos(phase + 2 * math.pi * (z0 - p.z) / lam)
        side = n.cross(Vector((0, 0, 1)))
        side = side.normalized() if side.length > 1e-4 else Vector((1, 0, 0))
        out.append((p + n * a + side * b, n))
    return out


# cross-sections (x across the width -1..1, y off the head; counter-clockwise): "diamond" = spikes (a ridge 0.3 of the
# width off centre, flat underside: VRoid / CHARM, tinakuang), "crescent" = sheets (thin, rounded edges), "lens" = v2
SECTIONS = {
    "diamond": [(1, 0), (0.3, 1), (-1, 0), (-0.3, -0.45), (0.3, -0.45)],
    "crescent": [(1, 0), (0.6, 0.8), (0, 1), (-0.6, 0.8), (-1, 0), (-0.6, 0.15), (0, 0.25), (0.6, 0.15)],
    "lens": [(math.cos(2 * math.pi * j / 8), math.sin(2 * math.pi * j / 8) * (1.0 if j <= 4 else 0.7)) for j in range(8)],
}


def _frames(pts):
    """per point: the tangent, the normal (off the head) and the binormal (across the width). The normal is carried
    along the path by the turn of its tangent (a rotation-minimising frame), then eased toward the volume's normal where
    that is well defined: a hanging end that flicks outward bends along its own normal, and projecting that normal
    there twisted the ribbon into a box"""
    out = []; N = len(pts); prev_a = prev_n = None
    for i, (p, n) in enumerate(pts):
        a = pts[min(i + 1, N - 1)][0] - pts[max(i - 1, 0)][0]
        a = a.normalized() if a.length > 1e-9 else (prev_a or Vector((0, 0, -1)))
        want = n - a * n.dot(a)
        if prev_n is None:
            nn = want.normalized() if want.length > 1e-6 else a.orthogonal().normalized()
        else:
            nn = prev_a.rotation_difference(a) @ prev_n; nn = (nn - a * nn.dot(a)).normalized()
            k = 0.35 * _smooth01((want.length - 0.4) / 0.4)      # (0 where the volume's normal runs along the path)
            if k > 0:
                w = want.normalized()
                if w.dot(nn) > -0.5: nn = (nn * (1 - k) + w * k).normalized()
        prev_a, prev_n = a, nn
        out.append((a, nn, a.cross(nn).normalized()))
    return out


def _bend_r(head, p):
    """the radius the hair's width wraps round here: the head ball above the cheeks, the head's axis below"""
    if p.z > head.eyeZ - 0.02: r = (p - head.C).length
    else: r = Vector((p.x - head.C.x, p.y - head.C.y, 0)).length
    return min(0.2, max(0.06, r))


def _ribbon(bm, pts, arcs, w0, thick, profile, kfun, kv, head, section="lens", gap=0.0015, lfun=None):
    """one piece of hair along pts: width w0 * profile(arc), thickness thick(width), the section bent round the head (a
    wide panel hugs the volume instead of standing off it at the edges); verts with their place along the path, and
    each vert's normal mix k into kv"""
    sec = SECTIONS[section]; M = len(sec)
    rings, out = [], []; N = len(pts); fr = _frames(pts)
    for i, (p, n) in enumerate(pts):
        a, nn, b = fr[i]; w = w0 * profile(arcs[i])
        if i == N - 1 or w < 1e-4:
            v = bm.verts.new(p); rings.append([v]); out.append((v, i)); kv.append((v, kfun(arcs[i]), lfun(arcs[i]) if lfun else 1.0)); break
        th = thick(w, i / max(1, N - 1)); R = _bend_r(head, p)
        ring = []
        for x, y in sec:
            X = x * w / 2
            q = p + b * X + nn * (y * th / 2 - X * X / (2 * R))
            if gap: q = head.keep_out(q, gap)
            v = bm.verts.new(q); ring.append(v); out.append((v, i)); kv.append((v, kfun(arcs[i]), lfun(arcs[i]) if lfun else 1.0))
        rings.append(ring)
    for i in range(len(rings) - 1):
        A, B = rings[i], rings[i + 1]
        for j in range(M):
            if len(B) == 1: bm.faces.new((B[0], A[(j + 1) % M], A[j]))
            else: bm.faces.new((B[j], B[(j + 1) % M], A[(j + 1) % M], A[j]))
    if len(rings[0]) > 2: bm.faces.new(rings[0])
    return out


def _panel(bm, pts, i_free, w0, Z, H, head, rnd, kv, thickK, section, tip_section):
    """a clump as the tutorials build it: one continuous body, its end split into points (1 : 0.6 : 0.35 wide, 1 : 0.7 :
    0.45 long for 2-3 points; more points alternate long and short), V-notches between them. Returns its verts with
    their index along the centre line (for the spring weights)"""
    N = len(pts); cum = [0.0]
    for i in range(N - 1): cum.append(cum[-1] + (pts[i + 1][0] - pts[i][0]).length)
    L = cum[-1]; a_free = cum[i_free]
    kB, kT = H.get("normalK", 0.8), H.get("tipNormalK", 0.25)
    def kfun(a): return kB + (kT - kB) * _smooth01((a - a_free) / max(1e-4, L - a_free))
    # ink: none on the bodies, growing over the free part (the engine's lineMask reads it from the UVs; the silhouette
    # always inks)
    # ink weight along the lock: full on the free tip; "inkBody" (0..1) also inks the body's lower part, rising from
    # half way down it (the sheet's layered short hair outlines each lock's end, not only the free spikes)
    ib = Z.get("inkBody", H.get("inkBody", 0.0))
    def lfun(a):
        tip = _smooth01((a - a_free + 0.004) / max(0.008, Z.get("inkFrom", 0.45) * (L - a_free)))
        return max(tip, ib * _smooth01((a - 0.5 * a_free) / max(0.008, 0.5 * a_free))) if ib else tip
    def thick(w, s): return max(w * thickK * (1 - 0.35 * s), 0.0016 * (1 - s) + 0.0006)
    # widths: a wedge (narrow at the whorl, where the clumps all start, full where it leaves the volume), then the free
    # part tapers to a point (a concave "flame": still 0.35 wide at 90%)
    mode = Z.get("mode", "spike"); wedge = Z.get("wedge", 0.5)
    def body(a): return (wedge + (1 - wedge) * _smooth01(a / max(a_free, 1e-3))) * (0.7 + 0.3 * _smooth01(a / 0.012))
    a_t = a_free + (L - a_free) * (0.72 if mode == "hang" else 0.0)
    def prof(a): return body(a) * ((1 - min(1.0, (a - a_t) / max(L - a_t, 1e-6))) ** Z.get("taper", 0.5) if a > a_t else 1.0)
    sp = Z.get("split", [1, 1]); ns = rnd.randint(sp[0], sp[1])
    if ns <= 1:
        return _ribbon(bm, pts, cum, w0, thick, prof, kfun, kv, head, section, lfun=lfun)
    sl = Z.get("splitLen", Z.get("splitD", 0.45) * (L - a_free))
    a0 = max(cum[min(2, N - 1)], L - sl); ov = 0.3 * sl
    iB = next((i for i in range(N) if cum[i] >= a0 + ov), N - 1)
    i0 = next((i for i in range(N) if cum[i] >= a0), N - 1)
    aB = cum[iB]
    def prof_body(a):     # full width past the split, narrowing under the points
        return body(min(a, a0)) * (1 - 0.8 * _smooth01((a - (aB - ov * 0.7)) / (ov * 0.7)))
    out = _ribbon(bm, pts[:iB + 1], cum, w0, thick, prof_body, kfun, kv, head, section, lfun=lfun)
    out = [(v, i) for v, i in out]
    wS = w0 * body(a0)
    if ns <= 3: widths, lens = [1, 0.6, 0.35][:ns], [1, 0.7, 0.45][:ns]
    else:
        widths = [rnd.uniform(0.5, 1.0) for _ in range(ns)]
        lens = [rnd.uniform(0.8, 1.0) if j % 2 == 0 else rnd.uniform(0.45, 0.75) for j in range(ns)]
    order = list(range(ns)); rnd.shuffle(order)
    sc = wS * Z.get("cover", 1.2) / sum(widths); x = -wS * Z.get("cover", 1.2) / 2
    fr = _frames(pts); fan = Z.get("fan", 0.3); hookT = Z.get("tipHook", 0.0)
    for jn, j in enumerate(order):
        wj = widths[j] * sc; xc = x + wj / 2; x += wj
        Lj = (L - a0) * lens[j] * rnd.uniform(0.9, 1.1)
        tp, ta, ti = [], [], []
        alt = 1 if jn % 2 == 0 else -1; liftJ = rnd.uniform(-0.3, 1.0) * Z.get("tipLift", 0.0)
        for i in range(i0, N):
            t = (cum[i] - a0) / max(1e-6, L - a0)
            if cum[i] - a0 > Lj and len(tp) >= 3: break
            p, n = pts[i]; a, nn, b = fr[i]
            off = xc * (1 + fan * t) + alt * hookT * t * t * (L - a0)
            tuck = 1 - _smooth01((cum[i] - a0) / max(ov, 1e-4))      # (under the body until the body ends)
            q = p + b * off - nn * (off * off / (2 * _bend_r(head, p))) + nn * (liftJ * t * t * (L - a0)) - nn * (tuck * thick(wS, 0.3) * 0.45)
            q = head.keep_out(q, Z.get("float", 0.004))
            tp.append((q, n)); ta.append(cum[i]); ti.append(i)
        if len(tp) < 3: continue
        Lt = ta[-1] - ta[0]
        vs = _ribbon(bm, tp, ta, wj * 1.15, thick, lambda a, a_s=ta[0], Lt=Lt: (0.7 + 0.3 * _smooth01((a - a_s) / max(ov * 0.5, 1e-4))) * (1 - min(1.0, (a - a_s) / max(Lt, 1e-6))) ** Z.get("tipTaper", 0.45),
                     kfun, kv, head, tip_section, lfun=lfun)
        out += [(v, ti[i]) for v, i in vs]
    return out


def _proxy_normals(obj, head, ks):
    """the hair shades as one mass: each vertex's normal mostly the volume's (round the head centre above the cheeks, round
    the head's vertical axis below), a little its own; ks: per vertex how much (high on the bodies, low on the free tips,
    so each spike still gets a lit and a shaded side)"""
    me = obj.data; me.update()
    mw = obj.matrix_world; inv3 = mw.to_3x3().inverted()
    out = []
    for v in me.vertices:
        p = mw @ v.co; g = (mw.to_3x3() @ v.normal).normalized(); k = ks[v.index] if isinstance(ks, list) else ks
        r = p - head.C; below = _smooth01((head.eyeZ - 0.02 - p.z) / 0.06)
        sph = Vector((r.x / 0.09 ** 2, r.y / 0.1 ** 2, r.z / 0.11 ** 2)).normalized()
        cyl = Vector((r.x, r.y, 0)); cyl = cyl.normalized() if cyl.length > 1e-5 else sph
        px = (sph * (1 - below) + cyl * below).normalized()
        out.append(tuple((inv3 @ (px * k + g * (1 - k))).normalized()))
    me.normals_split_custom_set_from_vertices(out)


def build_hair_v2(body, rig, eyes, H):
    rnd = random.Random(H.get("seed", 1))
    head = Head(body, eyes, H); vol = Volume(head, H)
    bm_o, bm_u = bmesh.new(), bmesh.new(); locks = []; kv_o, kv_u = [], []
    style = H.get("style", "spiky")
    thickK = H.get("thickK", 0.22 if style == "spiky" else 0.16)
    groups = {}
    for Z in H["zones"]:
        # (each zone draws from its own random stream: adding or dropping a zone leaves the others as they were)
        rnd = random.Random(H.get("seed", 1) * 1000003 + zlib.crc32(Z.get("name", "").encode()))
        counts = Z.get("count", [2, 2, 0]); widths = Z.get("w", [0.05, 0.03, 0.015])
        tiers = [t for t, c in enumerate(counts) for _ in range(c)]
        # the big ones evenly round the zone, the smaller ones between them (and a layer above, so they break the edges)
        order = sorted(range(len(tiers)), key=lambda i: (tiers[i], i))
        n_k = len(tiers); slots = list(range(n_k))
        prim = [i for i in order if tiers[i] == 0]; rest = [i for i in order if tiers[i] > 0]
        place = {}
        step = n_k / max(1, len(prim))
        used = set()
        for j, i in enumerate(prim):
            sl = int(round(j * step + step / 2 - 0.5)) % n_k
            while sl in used: sl = (sl + 1) % n_k
            place[i] = sl; used.add(sl)
        free = [s for s in slots if s not in used]
        rnd.shuffle(free)
        for i, sl in zip(rest, free): place[i] = sl
        for i, tier in enumerate(tiers):
            k = place[i]
            ra = Z["rootAz"][0] + (Z["rootAz"][1] - Z["rootAz"][0]) * (k + rnd.uniform(0.2, 0.8)) / n_k
            re = rnd.uniform(*Z.get("rootEl", [55, 68]))
            Zt = dict(Z); Zt["layer"] = Z.get("layer", 0) + tier * 0.6
            pts, az_t, i_free = _path(head, vol, _dir(ra, re), Zt, k, n_k, rnd, H)
            if len(pts) < 4: continue
            if Z.get("mode") == "hang" and H.get("wave"):
                g = round(az_t / H.get("waveGroup", 32))
                if g not in groups: groups[g] = H.get("wave0", 1.3) + g * H.get("wavePhase", 1.9) + rnd.uniform(-0.15, 0.15)     # (neighbouring sheets 20-45 degrees apart: one wave through the hair, not strings)
                pts = _waves(pts, head, Z, groups[g], H)
            w0 = widths[tier] * rnd.uniform(0.85, 1.15)
            under = bool(Z.get("under"))
            sec = Z.get("section", H.get("section", "lens")); tsec = Z.get("tipSection", H.get("tipSection", sec))
            vs = _panel(bm_u if under else bm_o, pts, i_free, w0, Z, H, head, rnd, kv_u if under else kv_o,
                        Z.get("thickK", thickK), sec, tsec)
            locks.append((pts, vs, Z.get("mode") == "bang", under))
    bm_o.verts.index_update(); bm_u.verts.index_update()
    locks = [(pts, [(v.index, i) for v, i in vs], f, u) for pts, vs, f, u in locks]     # (indices before the bmesh goes)
    ks = {"Hair": [0.0] * len(bm_o.verts), "HairUnder": [0.0] * len(bm_u.verts)}
    ink = {"Hair": [0.0] * len(bm_o.verts), "HairUnder": [0.0] * len(bm_u.verts)}
    for kv, nm in ((kv_o, "Hair"), (kv_u, "HairUnder")):
        for v, k, l in kv: ks[nm][v.index] = k; ink[nm][v.index] = l
    # the cap: the scalp above the hairline on the volume (just under the clumps' roots), so no skin shows between them
    mw = body.matrix_world; me = body.data; Vw = head.V
    # (it stops capInset above the hairline: the edge of the hair is made of the clumps' tips, not of the cap)
    inset = H.get("capInset", 0.02)
    def in_cap(q):
        d = q - head.C; return q.z > head.hairline_z(math.atan2(d.x, -d.y)) + inset
    cap_faces = [p for p in me.polygons if in_cap(mw @ p.center) and (mw @ p.center - head.C).length < 0.16]
    used = {}; capbm = bmesh.new()
    for p in cap_faces:
        vs = []
        for vi in p.vertices:
            if vi not in used:
                q = Vw[vi]; loc, n, _, _ = head.bvh.find_nearest(q)
                n = n if n.dot(q - head.C) > 0 else -n
                used[vi] = capbm.verts.new(q + n * (H.get("cap", 0.003) + vol.off(q) * H.get("capK", 0.85)))
            vs.append(used[vi])
        try: capbm.faces.new(vs)
        except ValueError: pass
    objs = []
    for name, b, col in (("Hair", bm_o, H.get("color", "#c8a064")), ("HairUnder", bm_u, H.get("underColor", H.get("capColor", H.get("color")))), ("HairCap", capbm, H.get("capColor", H.get("color")))):
        if not b.verts: b.free(); continue
        b.verts.index_update(); m = bpy.data.meshes.new(name); b.to_mesh(m); b.free()
        o = bpy.data.objects.new(name, m); bpy.context.scene.collection.objects.link(o)
        for poly in o.data.polygons: poly.use_smooth = True
        o.data.materials.append(_mat(f"{name}_00_HAIR", col)); objs.append(o)
        _proxy_normals(o, head, ks.get(name, H.get("capNormalK", 0.85)))
        # the ink weight per vertex in the UVs (u; the hair has no texture): 0 on the bodies and the cap, 1 on free tips
        uvl = m.uv_layers.new(name="UVMap"); w = ink.get(name)
        for lp in m.loops: uvl.data[lp.index].uv = ((w[lp.vertex_index] if w else 0.0), 0.0)
    hair = objs[0]
    for o in objs:
        g = o.vertex_groups.new(name="head"); g.add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    springs = []
    if H.get("springs", style == "wavy"):
        # (springs on the outer clumps; vertex indices are per object, so the under-layer rides the head)
        outer = [([p for p, _ in pts], vs, f) for pts, vs, f, u in locks if not u]
        springs = _spring_chains(hair, rig, outer, H)
    for o in objs:
        o.parent = rig; mod = o.modifiers.new("Armature", "ARMATURE"); mod.object = rig
    print("hair v2:", style, len(locks), "clumps,", sum(1 for l in locks if l[2]), "bangs,", sum(1 for l in locks if l[3]), "under, cap", len(cap_faces), "faces, springs", len(springs))
    H["_colliders"] = [("head", head.C.copy(), H.get("headR", 0.09)),
                       ("head", Vector((0.0, head.eyeY + H.get("faceBack", 0.04), head.eyeZ - 0.03)), H.get("faceR", 0.062))]
    return objs, springs
