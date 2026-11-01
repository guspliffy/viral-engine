"""A mountain-bike riser handlebar (bar, ribbed lock-on grips, stem clamp with bolts, brake levers and cables),
modelled in Blender for the first-person rides (the Easy Trail POV: the bar fills a third of the frame).

  blender -b -P tools/blender/bike-handlebar.py -- assets/models/props/bike-handlebar.glb [preview.png]

Real bars first (nature/real-object notes): a riser bar is one bent tube, thicker at the clamp (31.8 mm) than at the
grips (22.2 mm), rising 20-30 mm on each side; the grips are rubber with rings of ridges and an aluminium lock-on
collar at the inner end; the stem's faceplate is held by four bolts; brake levers sit just inside the grips, angled
down about 30 degrees, with a thin clamp, and their cables loop forward and down to the frame. Chrome or black
anodised metal shows bright, hard highlights; rubber is matte.

Space: the bike prop's frame group (engine/page/props3d.js bike(): its front towards +z, y up, the bar at y 0.76,
z 0.24, grips centred x +-0.215, radius 0.021), so it drops in where the code-built bar was and the grips stay where
the gloves hold them. Blender: z up, front -y; the glTF exporter turns that back into y up, front +z.
Materials: "metal" (chrome), "rubber" (grips, black), "frame" (the stem, recoloured to the bike's colour by the
engine), "cable" (black housing).
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "bike-handlebar.glb"
PREVIEW = argv[1] if len(argv) > 1 else None


def E(x, y, z):
    """engine (x, y, z) -> Blender (x, -z, y)"""
    return Vector((x, -z, y))


bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene


def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def mat(name, color, rough, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(color), 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    return m


M = {"metal": mat("metal", "#a9aeb6", 0.22, 0.9), "rubber": mat("rubber", "#202024", 0.85), "frame": mat("frame", "#7b4fd0", 0.35, 0.3), "cable": mat("cable", "#141416", 0.5)}
parts = []


def smooth(o, m):
    o.data.materials.append(M[m])
    for p in o.data.polygons:
        p.use_smooth = True
    parts.append(o); return o


def curve_tube(pts, r, m, res=4, taper=None):
    cu = bpy.data.curves.new("c", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = res; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (*c, 1)
    sp.use_endpoint_u = True; sp.order_u = 4; sp.resolution_u = 16
    if taper:
        for p, t in zip(sp.points, taper):
            p.radius = t
    ob = bpy.data.objects.new("c", cu); scn.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.convert(target="MESH"); ob.select_set(False)
    return smooth(ob, m)


def lathe(profile, m, axis_pos, axis_dir, segs=40):
    """a turned part: profile [(along, radius)] spun round an axis (grips, collars, plugs)"""
    bm = bmesh.new(); rings = []
    d = axis_dir.normalized(); u = d.orthogonal().normalized(); w = d.cross(u)
    for (a, r) in profile:
        ring = [bm.verts.new(axis_pos + d * a + (u * math.cos(t) + w * math.sin(t)) * r) for t in [2 * math.pi * k / segs for k in range(segs)]]
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((r0[k], r0[(k + 1) % segs], r1[(k + 1) % segs], r1[k]))
    for ring in (rings[0], rings[-1]):
        bm.faces.new(ring)
    me = bpy.data.meshes.new("l"); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("l", me); scn.collection.objects.link(ob)
    return smooth(ob, m)


def box(center, size, m, bevel=0.004, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.active_object; o.scale = size
    if rot:
        o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    b = o.modifiers.new("b", "BEVEL"); b.width = bevel; b.segments = 3
    bpy.ops.object.modifier_apply(modifier="b")
    return smooth(o, m)


# ---- the bar: the code bar's path (props3d.js riser pts), thicker in the middle where the stem clamps it
pts = [E(*p) for p in [(-0.275, 0.76, 0.24), (-0.15, 0.76, 0.24), (-0.075, 0.736, 0.245), (0, 0.73, 0.245), (0.075, 0.736, 0.245), (0.15, 0.76, 0.24), (0.275, 0.76, 0.24)]]
curve_tube(pts, 0.0125, "metal", taper=[0.9, 0.9, 1.05, 1.28, 1.05, 0.9, 0.9])

# ---- grips: ribbed rubber (rings of ridges), a flared outer end, an aluminium lock-on collar inside, a bar-end plug
for s in (-1, 1):
    x0, x1 = s * 0.155, s * 0.282
    axis = Vector((s, 0, 0)); base = E(x0, 0.76, 0.24)
    L = abs(x1 - x0); prof = [(0, 0.0)]
    n = 22
    for k in range(n + 1):
        a = L * k / n; r = 0.021 + (0.0022 if k % 2 else -0.0006)
        if k > n - 3:
            r += 0.003            # the flange at the outer end
        prof.append((a, r))
    prof.append((L, 0.0))
    lathe(prof, "rubber", base, axis)
    lathe([(0, 0.0), (0, 0.0235), (0.012, 0.0235), (0.012, 0.0)], "metal", E(s * 0.148, 0.76, 0.24), axis)        # lock-on collar
    lathe([(0, 0.0), (0, 0.0205), (0.006, 0.0195), (0.006, 0.0)], "metal", E(x1, 0.76, 0.24), axis)             # bar-end plug

# ---- stem: a chunky clamp round the bar's middle, a faceplate with four bolts, and the body down to the steerer
box(E(0, 0.731, 0.236), (0.058, 0.052, 0.05), "frame", bevel=0.008)                    # clamp body (frame colour)
box(E(0, 0.731, 0.266), (0.064, 0.012, 0.046), "frame", bevel=0.004)                   # faceplate
for bx in (-0.022, 0.022):
    for bz in (-0.014, 0.014):
        lathe([(0, 0.0), (0, 0.0045), (0.006, 0.0045), (0.006, 0.0)], "metal", E(bx, 0.731 + bz, 0.272), Vector((0, -1, 0)), 16)
box(E(0, 0.72, 0.205), (0.04, 0.05, 0.045), "frame", bevel=0.01, rot=(math.radians(-14), 0, 0))   # stem body
for k in range(3):                                                                     # spacers on the steerer
    lathe([(0, 0.0), (0, 0.019), (0.008, 0.019), (0.008, 0.0)], "metal" if k % 2 else "frame", E(0, 0.69 - k * 0.009, 0.186), Vector((0, 0, -1)), 24)

# ---- brake levers: a clamp on the bar, the lever blade angled down and forward, cables looping to the frame
for s in (-1, 1):
    cx = s * 0.138
    lathe([(0, 0.0), (0, 0.017), (0.018, 0.017), (0.018, 0.0)], "metal", E(cx - s * 0.009, 0.76, 0.24), Vector((s, 0, 0)), 20)
    blade = [E(cx, 0.758, 0.262), E(cx + s * 0.03, 0.748, 0.29), E(cx + s * 0.07, 0.732, 0.298), E(cx + s * 0.095, 0.725, 0.292)]
    curve_tube([tuple(p) for p in blade], 0.0055, "metal", res=2, taper=[1.4, 1.1, 1.0, 0.8])
    cable = [E(cx, 0.775, 0.25), E(cx * 0.8, 0.82, 0.29), E(cx * 0.35, 0.78, 0.34), E(s * 0.02, 0.64, 0.31), E(s * 0.012, 0.55, 0.3)]
    curve_tube([tuple(p) for p in cable], 0.0035, "cable", res=2)

for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
bar = bpy.context.active_object; bar.name = "handlebar"
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_yup=True, export_apply=True)
print("wrote", OUT, "verts", len(bar.data.vertices))

if PREVIEW:
    scn.render.engine = "CYCLES"; scn.cycles.samples = 24; scn.cycles.device = "CPU"
    scn.render.resolution_x, scn.render.resolution_y = 720, 405
    w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.78, 0.7, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); scn.collection.objects.link(sun)
    sun.data.energy = 4; sun.rotation_euler = (math.radians(40), 0, math.radians(30))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); scn.collection.objects.link(cam); scn.camera = cam
    cam.location = E(0, 0.98, -0.18); cam.data.lens = 24
    d = E(0, 0.72, 0.3) - cam.location; cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = PREVIEW; bpy.ops.render.render(write_still=True)
