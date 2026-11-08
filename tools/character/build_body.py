"""Our own human base, built by script: a MakeHuman (MPFB2, CC0 assets) body in any shape, rigged, put in a T pose
and exported as a VRM 1.0 the engine's rig "vrm-v1" can load.

    blender -b --factory-startup -P tools/character/build_body.py -- <spec.json> <out.vrm>

spec.json: { "name", "body": { "gender" 0..1, "age" 0..1, "muscle" 0..1, "weight" 0..1, "height" 0..1,
             "proportions" 0..1, "cupsize", "firmness", ... (any MPFB macro) }, "skin": "#rrggbb" }
Needs the MPFB2 and VRM Add-on for Blender extensions enabled as bl_ext.user_default.mpfb / .vrm
(tools/character/setup.sh). Step 1 of the own-character pipeline: body + rig + export only (no anime head, hair or
clothes yet).
"""
import bpy, sys, json, math, importlib, addon_utils
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
spec = json.load(open(argv[0])); out = argv[1]
for ext in ("mpfb", "vrm"): addon_utils.enable(f"bl_ext.user_default.{ext}", default_set=True)

def imp(pkg, key):
    for m in list(sys.modules):
        if m.endswith(pkg): return getattr(importlib.import_module(m), key)
    raise ValueError(pkg)
HumanService = imp("mpfb.services.humanservice", "HumanService")
HOP = imp("mpfb.entities.objectproperties", "HumanObjectProperties")
TS = imp("mpfb.services.targetservice", "TargetService")

for o in list(bpy.data.objects): bpy.data.objects.remove(o)
body = HumanService.create_human(scale=0.1)
for k, v in spec.get("body", {}).items(): HOP.set_value(k, v, entity_reference=body)
TS.reapply_macro_details(body)

# face and detail targets (MakeHuman's CC0 targets by name: "nose-scale-vert-decr": 0.6, ...), e.g. the anime preset
for name, w in spec.get("targets", {}).items():
    path = TS.target_full_path(name)
    if not path: print("no target", name); continue
    TS.load_target(body, path, weight=w)

def stature():
    dg = bpy.context.evaluated_depsgraph_get(); ev = body.evaluated_get(dg); me = ev.to_mesh()
    zs = [(body.matrix_world @ v.co).z for v in me.vertices]; ev.to_mesh_clear(); return max(zs) - min(zs)
# "stature" (metres): the height macro searched until the body stands that tall (the macro's own scale depends on
# gender and age, and 0.49-0.51 is a dead band)
if spec.get("stature"):
    lo, hi = 0.0, 1.0
    for _ in range(14):
        mid = (lo + hi) / 2; HOP.set_value("height", mid, entity_reference=body); TS.reapply_macro_details(body)
        if stature() < spec["stature"]: lo = mid
        else: hi = mid
    print("height macro", round(mid, 4), "stature", round(stature(), 3))
def group_points(name):
    gi = body.vertex_groups[name].index
    # (called after the morphs are baked into the mesh, before the helper geometry is cut away)
    return [body.matrix_world @ v.co for v in body.data.vertices if any(g.group == gi for g in v.groups)]
def centre(pts): return sum(pts, Vector()) / len(pts)
rig = HumanService.add_builtin_rig(body, "game_engine")

# bake the morphs and drop the helper geometry: shape keys mixed into the mesh, the "Hide helpers" mask applied
bpy.context.view_layer.objects.active = body
if body.data.shape_keys:
    body.shape_key_add(name="mix", from_mix=True)
    keys = body.data.shape_keys.key_blocks
    mix = keys["mix"]
    for i, v in enumerate(body.data.vertices): v.co = mix.data[i].co
    body.shape_key_clear()
# where the eyes, mouth and nose tip are (the eyeball helpers are cut away with the other helpers next)
EYES = {}
for s_ in ("l", "r"):
    P = group_points(f"helper-{s_}-eye"); c = centre(P); EYES[s_] = (tuple(c), max((p - c).length for p in P))
EYES["mouth"] = tuple(centre(group_points("lips")))
EYES["nose"] = tuple(min((p for p in group_points("body") if abs(p.x) < 0.004 and EYES["mouth"][2] < p.z < EYES["l"][0][2]), key=lambda p: p.y))
print("eyes", EYES)
for m in list(body.modifiers):
    if m.type == "MASK":
        bpy.ops.object.modifier_apply(modifier=m.name)

# T pose: arms straight out sideways (VRM's rest pose), applied as the new rest so the bind matches
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="POSE")
for side, sx in (("l", 1), ("r", -1)):
    for bn in (f"upperarm_{side}", f"lowerarm_{side}", f"hand_{side}"):
        pb = rig.pose.bones[bn]
        head = rig.matrix_world @ pb.head; tail = rig.matrix_world @ pb.tail
        cur = (tail - head).normalized(); want = Vector((sx, 0, 0))
        q = cur.rotation_difference(want)
        M = rig.matrix_world.inverted() @ (Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head)) @ rig.matrix_world @ pb.matrix
        pb.matrix = M; bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode="OBJECT")
bpy.context.view_layer.objects.active = body
for m in list(body.modifiers):
    if m.type == "ARMATURE":
        name = m.name; bpy.ops.object.modifier_copy(modifier=name)
        bpy.ops.object.modifier_apply(modifier=name)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="POSE"); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode="OBJECT")
for m in body.modifiers:
    if m.type == "ARMATURE": m.object = rig

# one plain skin material, named the way the engine's VRoid code reads roles (_SKIN)
mat = bpy.data.materials.new("Body_00_SKIN"); mat.use_nodes = True
c = spec.get("skin", "#f3c9a0").lstrip("#"); rgb = [int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)]
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*[x ** 2.2 for x in rgb], 1)
body.data.materials.clear(); body.data.materials.append(mat); body.name = "Body"

face = None
if spec.get("face"):
    sys.path.insert(0, "tools/character")
    import face as facekit
    face, face_keys = facekit.build_face(body, rig, EYES, spec["face"])

# drawn anatomy (tools/character/anatomy.py): smoothed shading normals on the body, the reference sheet's body lines
if spec.get("anatomy"):
    sys.path.insert(0, "tools/character")
    import anatomy as anatkit
    anatkit.build_anatomy(body, rig, EYES, spec["anatomy"])

hair_springs = None
if spec.get("hair"):
    sys.path.insert(0, "tools/character")
    import hair as hairkit
    _, hair_springs = hairkit.build_hair(body, rig, EYES, spec["hair"])

if spec.get("clothes"):
    sys.path.insert(0, "tools/character")
    import clothes as clotheskit
    clotheskit.build_clothes(body, rig, spec["clothes"])

if spec.get("accessories"):
    sys.path.insert(0, "tools/character")
    import accessories as acckit
    acckit.build_accessories(body, rig, EYES, spec["accessories"], spec.get("face"))

# the head made bigger as the last step ("headScale", 8 Nov: the reference sheets draw 6-6.3 heads tall, the MakeHuman body
# is 7): everything the head carries (head skin, face parts, hair, glasses, the hair's spring bones and colliders) scaled
# round the top of the neck; a vertex the neck and head share scales by its head weight, so the neck blends
def scale_head(rig, k, H=None):
    import bmesh
    bones = rig.data.bones; hb = bones["head"]
    sub = {"head"} | {b.name for b in hb.children_recursive}
    P = rig.matrix_world @ hb.head_local
    f = lambda q, w: P + (q - P) * (1 + (k - 1) * w)
    n = 0
    for o in bpy.data.objects:
        if o.type != "MESH" or not any(m.type == "ARMATURE" and m.object == rig for m in o.modifiers): continue
        gn = {g.index: g.name for g in o.vertex_groups}
        mw = o.matrix_world; inv = mw.inverted(); me = o.data
        W = []
        for v in me.vertices:
            tot = sum(g.weight for g in v.groups if gn.get(g.group) in bones)
            wh = sum(g.weight for g in v.groups if gn.get(g.group) in sub)
            W.append(wh / tot if tot > 1e-6 else 0.0)
        if not any(w > 0 for w in W): continue
        if me.shape_keys:
            for kb in me.shape_keys.key_blocks:
                for i, w in enumerate(W):
                    if w > 0: kb.data[i].co = inv @ f(mw @ kb.data[i].co, w)
        for i, w in enumerate(W):
            if w > 0: me.vertices[i].co = inv @ f(mw @ me.vertices[i].co, w)
        me.update(); n += 1
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode="EDIT")
    Pl = rig.matrix_world.inverted() @ P
    for eb in rig.data.edit_bones:
        if eb.name in sub and eb.name != "head":
            eb.head = Pl + (eb.head - Pl) * k; eb.tail = Pl + (eb.tail - Pl) * k
        elif eb.name == "head": eb.tail = Pl + (eb.tail - Pl) * k
    bpy.ops.object.mode_set(mode="OBJECT")
    if H and H.get("_colliders"):
        H["_colliders"] = [(b, (P + (Vector(w) - P) * k) if b in sub else w, r * k if b in sub else r) for (b, w, r) in H["_colliders"]]
    print("head scaled", k, "on", n, "meshes round", tuple(round(x, 3) for x in P))


if spec.get("headScale"): scale_head(rig, spec["headScale"], spec.get("hair"))

# VRM 1.0 humanoid: game_engine bone names -> VRM bones
ext = rig.data.vrm_addon_extension; ext.spec_version = "1.0"
hb = ext.vrm1.humanoid.human_bones
MAP = {"hips": "pelvis", "spine": "spine_01", "chest": "spine_02", "upper_chest": "spine_03", "neck": "neck_01", "head": "head"}
for s, S in (("l", "left"), ("r", "right")):
    MAP.update({f"{S}_shoulder": f"clavicle_{s}", f"{S}_upper_arm": f"upperarm_{s}", f"{S}_lower_arm": f"lowerarm_{s}",
                f"{S}_hand": f"hand_{s}", f"{S}_upper_leg": f"thigh_{s}", f"{S}_lower_leg": f"calf_{s}",
                f"{S}_foot": f"foot_{s}", f"{S}_toes": f"ball_{s}"})
    for fin, mh in (("thumb", "thumb"), ("index", "index"), ("middle", "middle"), ("ring", "ring"), ("little", "pinky")):
        names = ("metacarpal", "proximal", "distal") if fin == "thumb" else ("proximal", "intermediate", "distal")
        for k, nm in enumerate(names): MAP[f"{S}_{fin}_{nm}"] = f"{mh}_0{k + 1}_{s}"
missing = []
for vb, bb in MAP.items():
    if bb in rig.data.bones and hasattr(hb, vb): getattr(hb, vb).node.bone_name = bb
    else: missing.append((vb, bb))
print("unmapped:", missing)
if face: facekit.bind_expressions(rig, face, face_keys)
if hair_springs: hairkit.bind_springs(rig, hair_springs, spec["hair"])
meta = ext.vrm1.meta; meta.vrm_name = spec.get("name", "own-human")
meta.authors.clear(); a = meta.authors.add(); a.value = "PotatoBrawl viral engine (MakeHuman CC0 base)"
rig.name = "Armature"

bpy.ops.object.select_all(action="DESELECT")
bpy.ops.export_scene.vrm(filepath=out)
print("wrote", out, "verts", len(body.data.vertices), "height", round(max((rig.matrix_world @ body.matrix_world @ v.co).z for v in body.data.vertices), 3))
