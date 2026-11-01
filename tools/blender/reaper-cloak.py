"""Reaper's hood and cloak, draped by Blender's cloth simulation over his potato body.

  blender -b -P tools/blender/reaper-cloak.py -- assets/models/characters/reaper-cloak.glb [preview.png]

Why: the code-built cloak (costumes-art-cast.js hoodedCloak) folds by a sine wave, so it reads as a smooth shell (an
egg from behind on the Easy Trail). Real cloth gets its folds from gravity and the body under it. Nature notes first
(feedback-copy-nature): a hood is a loose bag pinned round the face, so its crown sags onto the head and the spare
cloth falls into a few deep folds at the back of the neck; the point droops down the back under its own weight. A
cloak hangs from the shoulders: the cloth is wider at the hem than round the body, so it buckles into uneven tube
folds (a few big, many small), deeper at the back and sides, flatter where it lies on the belly; the front edges
fall straight.

Space: the character's bodyGroup (engine/page/potato.js), metres, y = 0 the ground. Blender is z-up with the front
at -y; the glTF exporter turns it into the engine's y-up with the front at +z. Body (characters/lookdev/reaper-crisp
.json): width 0.76, height 1.04, depth 0.72, taper 0.16, legs 0.14 -> centre y 0.66. Elevations (phi) and turns
(theta, 0 = front) as in potato.js surf(): the neck ring at phi -0.42 (his shoulders), the face opening ~0.62 rad
either side of the front (costumes-art-cast.js hoodieGeometry, hoodOpen 0.9).

Output: one glb with two materials, "cloak" (outside, charcoal) and "lining" (inside, near black), made with a
solidify modifier so the cloth has a thickness and a visible inner side.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "reaper-cloak.glb"
PREVIEW = argv[1] if len(argv) > 1 else None

RX, RY, RZ, CY, TAPER = 0.38, 0.52, 0.36, 0.66, 0.16
FACE_W, FACE_TOP, FACE_BOT = 0.66, 0.62, -0.5      # the face opening: half-width (rad of theta), top and bottom (phi)
NECK = -0.42                                         # where the cloak hangs from (phi)


def dir_of(th, ph):
    """engine direction (theta, phi) -> Blender unit vector (front = -y, up = +z)"""
    return Vector((math.sin(th) * math.cos(ph), -math.cos(th) * math.cos(ph), math.sin(ph)))


def body(d, grow=0.0):
    """the potato's surface along Blender direction d (unit), pushed out by grow metres"""
    t = 1 - TAPER * d.z
    p = Vector((d.x * RX * t, d.y * RZ * t, CY + d.z * RY))
    n = Vector((d.x / (RX * t) ** 2, d.y / (RZ * t) ** 2, d.z / RY ** 2)).normalized()
    return p + n * grow


def angles(d):
    return math.atan2(d.x, -d.y), math.asin(max(-1, min(1, d.z)))


bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.frame_start, scn.frame_end = 1, 90
scn.unit_settings.scale_length = 1.0

# ---- the body as a collider (a little fat so the cloth never touches the skin)
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=40, radius=1)
col = bpy.context.active_object; col.name = "body"
for v in col.data.vertices:
    v.co = body(v.co.normalized())
m = col.modifiers.new("collision", "COLLISION")
col.collision.thickness_outer = 0.012
col.collision.cloth_friction = 6.0


def cloth_settings(obj, pin, mass=0.25, bend=0.6, shrink=0.0):
    c = obj.modifiers.new("cloth", "CLOTH")
    s = c.settings
    s.quality = 12; s.mass = mass; s.air_damping = 1.5
    s.tension_stiffness = 18; s.compression_stiffness = 18; s.shear_stiffness = 8; s.bending_stiffness = bend
    s.vertex_group_mass = pin; s.shrink_min = shrink
    cs = c.collision_settings
    cs.collision_quality = 4; cs.distance_min = 0.006; cs.use_self_collision = True; cs.self_distance_min = 0.004
    c.point_cache.frame_start, c.point_cache.frame_end = 1, 90
    return c


# ---- one cowl: hood and cloak in one piece of cloth (a hooded cloak is cut that way), open at the face and in a
# narrow slit down the front, its hem near the ground. Starts as a loose bag round the head that flares into a wide
# cone below the shoulders; pinned round the face and along the shoulder line, everything else falls and drapes
SLIT, HEMPH = 0.0, -1.3                              # the front slit's half-width below the face (0: closed, Jonny's sheet), the hem (phi)
NU, HEM = 128, 0.05


def face_e(th, ph):
    """< 1 inside the face opening (an ellipse in theta, phi)"""
    return (th / FACE_W) ** 2 + ((ph - FACE_BOT) / (FACE_TOP - FACE_BOT) * 2 - 1) ** 2


def cut(th, ph):
    return ph < HEMPH or face_e(th, ph) < 1 or (SLIT > 0 and abs(th) < SLIT and ph < FACE_BOT + 0.05)


bpy.ops.mesh.primitive_uv_sphere_add(segments=NU, ring_count=88, radius=1)
cowl = bpy.context.active_object; cowl.name = "cowl"
bm = bmesh.new(); bm.from_mesh(cowl.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if cut(*angles(v.co.normalized()))], context="VERTS")
# clean edges: the cut leaves stair steps, so edge vertices snap onto the face ellipse, the slit or the hem line
mid = (FACE_TOP + FACE_BOT) / 2
for v in bm.verts:
    if not v.is_boundary:
        continue
    th, ph = angles(v.co.normalized())
    if ph < HEMPH + 0.06:
        ph = HEMPH
    elif SLIT > 0 and ph < FACE_BOT and abs(th) < SLIT + 0.12:
        th = math.copysign(SLIT, th)
    else:
        e = math.sqrt(max(1e-9, face_e(th, ph))); th, ph = th / e, mid + (ph - mid) / e
    v.co = dir_of(th, ph)
pin = []
for v in bm.verts:
    d = v.co.normalized(); th, ph = angles(d)
    if ph >= NECK:
        # the hood: a few cm off the head, looser at the crown; the point: a lobe pulled back from the crown
        p = body(d, 0.03 + 0.035 * max(0, d.z))
        a = d.angle(Vector((0, 0.6, 0.8)).normalized())
        p += Vector((0, 0.26, 0.0)) * math.exp(-(a / 0.36) ** 2)
    else:
        # the cloak: from the shoulder line out to a wide uneven ring above the ground (spare cloth for the folds)
        u = (NECK - ph) / (NECK - HEMPH)
        noise = 0.035 * math.sin(th * 2.3 + 0.7) + 0.025 * math.sin(th * 5.3 + 2.1) + 0.012 * math.sin(th * 11.7)
        r = 0.47 + noise + 0.05 * (1 - math.cos(th)) / 2
        hem = Vector((math.sin(th) * r, -math.cos(th) * r * 0.95, HEM + 0.1))
        p = body(dir_of(th, NECK), 0.035).lerp(hem, u ** 0.9)
    v.co = p
    rim = face_e(th, ph) < 1.3 and abs(th) < 1.1 and ph > FACE_BOT - 0.08
    shoulder = False   # resting on the body is enough; a pinned shoulder line left a ledge across the back
    pin.append(1.0 if rim or shoulder else 0.0)
bm.to_mesh(cowl.data); bm.free()
vg = cowl.vertex_groups.new(name="pin")
for i, w in enumerate(pin):
    if w > 0:
        vg.add([i], w, "REPLACE")
cloth_settings(cowl, "pin", mass=0.3, bend=4.0)

# ---- simulate: step the frames in order so the caches fill, then freeze the last frame
for f in range(1, 91):
    scn.frame_set(f)


def freeze(obj):
    bpy.context.view_layer.objects.active = obj
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="cloth")


freeze(cowl)


def face_rim(obj, r=0.014):
    """a rolled edge round the face opening (the hood's hem is folded back and sewn, so it stands as a soft bead):
    a tube along the opening's boundary loop (the edges whose both ends sit above the cloak's hem)"""
    bm = bmesh.new(); bm.from_mesh(obj.data)
    edges = [e for e in bm.edges if e.is_boundary and all(v.co.z > 0.35 for v in e.verts)]
    nxt = {}
    for e in edges:
        a, b = e.verts; nxt.setdefault(a.index, []).append(b.index); nxt.setdefault(b.index, []).append(a.index)
    start = edges[0].verts[0].index; loop = [start]; prev = None; cur = start
    while True:
        cand = [x for x in nxt[cur] if x != prev]
        if not cand or cand[0] == start:
            break
        prev, cur = cur, cand[0]; loop.append(cur)
    bm.verts.ensure_lookup_table()
    pts = [bm.verts[i].co.copy() for i in loop]; bm.free()
    cu = bpy.data.curves.new("rim", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c.x, c.y, c.z, 1)
    sp.use_cyclic_u = True
    ob = bpy.data.objects.new("rim", cu); scn.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True); bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active


rim = face_rim(cowl)
bpy.data.objects.remove(col, do_unlink=True)


def mat(name, color, rough=0.9):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough
    return m


def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


cl, ln = mat("cloak", srgb("#34313a")), mat("lining", srgb("#16141b"))
rim.data.materials.append(mat("trim", srgb("#46424d")))
for p in rim.data.polygons:
    p.use_smooth = True
for o in (cowl,):
    o.data.materials.append(cl); o.data.materials.append(ln)
    # the simulated mesh is fine enough on its own (no subdivision: a quarter of the size on the page)
    s = o.modifiers.new("thick", "SOLIDIFY"); s.thickness = 0.012; s.offset = 1; s.material_offset = 1; s.material_offset_rim = 0
    for p in o.data.polygons:
        p.use_smooth = True
    bpy.context.view_layer.objects.active = o
    for mod in ("thick",):
        bpy.ops.object.modifier_apply(modifier=mod)

os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=False, export_apply=True, export_yup=True, export_normals=True, export_materials="EXPORT")
print("wrote", OUT, "verts", len(cowl.data.vertices))

if PREVIEW:
    # a quick look: a stand-in potato, the cloak, three views (front three-quarter, side, back) with Cycles on the CPU
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=40, radius=1)
    pot = bpy.context.active_object
    for v in pot.data.vertices:
        v.co = body(v.co.normalized())
    pot.data.materials.append(mat("skin", srgb("#e2a95c"), 0.6))
    for p in pot.data.polygons:
        p.use_smooth = True
    scn.render.engine = "CYCLES"; scn.cycles.samples = 24; scn.cycles.device = "CPU"
    scn.render.resolution_x, scn.render.resolution_y = 420, 560
    w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.95, 0.85, 0.65, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); scn.collection.objects.link(sun)
    sun.data.energy = 3.5; sun.rotation_euler = (math.radians(50), 0, math.radians(35))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); scn.collection.objects.link(cam); scn.camera = cam
    cam.data.lens = 50
    base = os.path.splitext(PREVIEW)[0]
    for name, az in (("front", -30), ("side", 90), ("back", 180)):
        a = math.radians(az); dist = 3.4
        cam.location = (math.sin(a) * dist, -math.cos(a) * dist, 0.9)
        d = Vector((0, 0, 0.62)) - cam.location; cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        scn.render.filepath = f"{base}-{name}.png"; bpy.ops.render.render(write_still=True)
    print("previews", base)
