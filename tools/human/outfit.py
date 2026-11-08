"""Restyle a VRoid base (.vrm, VRM 0.x) into a character's outfit, by script, so it can be remade and changed.

    python3 tools/human/outfit.py <in.vrm> <out.vrm> <outfit.json> [preview-dir]

The base stays the CC0 VRoid sample; this only edits its clothes, so the result is our own derivative work:
  tops.cut       "tee": drop the hood (J_Sec_C_Hood* bones) and the sleeves past `sleeve` (0..1 along the upper arm)
  bottoms.baggy  radial puff of the trouser legs round the leg bones (1 = as modelled), gathered back to `cuff` at
                 the ankle over the last `cuffLen` metres (track pants: loose leg, elastic cuff)
  bottoms.stripe a side stripe painted into the trouser texture: { color, width (degrees round the leg) }
  paint          { "<material part>": "#rrggbb" }: the part's texture baked to that colour, its painted folds and
                 seams kept as light and dark of it (more predictable than the load-time tint for very dark or
                 very light originals); runs before the stripe
  tops.slim      0..1: the tee pulled in toward the body (a hoodie is cut far looser than a T-shirt); slimFront
                 the same for the front (the hoodie's pocket stands far off the belly); gap: never closer to the
                 skin than this (metres)
  shoes          false = barefoot (the VRoid body has whole feet under the shoes)
Colours stay in the character JSON's "look" (vrm.js recolours textures at load).
"""
import json, struct, sys, io, os
import numpy as np
from PIL import Image

src, dst, cfg_path = sys.argv[1:4]
prev = sys.argv[4] if len(sys.argv) > 4 else None
cfg = json.load(open(cfg_path))
data = open(src, "rb").read()
jl = struct.unpack("<I", data[12:16])[0]
J = json.loads(data[20:20 + jl])
bl = struct.unpack("<I", data[20 + jl:24 + jl])[0]
BIN = bytearray(data[28 + jl:28 + jl + bl])

NT = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}

def acc(i):
    a = J["accessors"][i]; bv = J["bufferViews"][a["bufferView"]]
    n = NT[a["type"]]; dt = CT[a["componentType"]]
    off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    st = bv.get("byteStride")
    if st and st != n * np.dtype(dt).itemsize: raise SystemExit("interleaved buffers not handled")
    return np.frombuffer(bytes(BIN), dt, count=a["count"] * n, offset=off).reshape(a["count"], n).copy()

def append(raw, target=None):
    while len(BIN) % 4: BIN.append(0)
    off = len(BIN); BIN.extend(raw)
    bv = {"buffer": 0, "byteOffset": off, "byteLength": len(raw)}
    if target: bv["target"] = target
    J["bufferViews"].append(bv); return len(J["bufferViews"]) - 1

def new_acc(arr, like, target):
    a = dict(J["accessors"][like]); a.pop("byteOffset", None); a.pop("sparse", None)
    a["bufferView"] = append(arr.astype(CT[a["componentType"]]).tobytes(), target); a["count"] = len(arr)
    if arr.ndim == 2 and arr.dtype.kind == "f": a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
    elif "min" in a: a["min"] = [int(arr.min())]; a["max"] = [int(arr.max())]
    J["accessors"].append(a); return len(J["accessors"]) - 1

# rest-pose joint positions (VRoid bakes the rest pose: nodes carry translations only)
nodes = J["nodes"]; parent = {}
for i, n in enumerate(nodes):
    for c in n.get("children", []): parent[c] = i
def world(i):
    p = np.zeros(3)
    while i is not None:
        n = nodes[i]
        if any(abs(v) > 1e-4 for v in n.get("rotation", [0, 0, 0, 1])[:3]): raise SystemExit(f"node {n['name']} is rotated")
        p += np.array(n.get("translation", [0, 0, 0])); i = parent.get(i)
    return p
byname = {n["name"]: i for i, n in enumerate(nodes)}
JP = {k: world(v) for k, v in byname.items() if k.startswith("J_")}
skin = J["skins"][0]; jname = [nodes[k]["name"] for k in skin["joints"]]
mats = [m["name"] for m in J["materials"]]

body = next(m for m in J["meshes"] if any("_CLOTH" in mats[p["material"]] for p in m["primitives"]))
p0 = body["primitives"][0]
P = acc(p0["attributes"]["POSITION"]); UV = acc(p0["attributes"]["TEXCOORD_0"])
JO = acc(p0["attributes"]["JOINTS_0"]); WE = acc(p0["attributes"]["WEIGHTS_0"])
dom = np.array([jname[k] for k in JO[np.arange(len(JO)), WE.argmax(1)]])
moved = P.copy()

def seg_t(p, a, b):
    ab = b - a; t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1); return t, a + t[:, None] * ab

def image_of(mat_i):
    ti = J["materials"][mat_i]["pbrMetallicRoughness"]["baseColorTexture"]["index"]
    im = J["images"][J["textures"][ti]["source"]]; bv = J["bufferViews"][im["bufferView"]]
    o = bv.get("byteOffset", 0)
    return im, Image.open(io.BytesIO(bytes(BIN[o:o + bv["byteLength"]]))).convert("RGBA")

def put_image(im, img, tag):
    buf = io.BytesIO(); img.save(buf, "PNG"); im["bufferView"] = append(buf.getvalue()); im["mimeType"] = "image/png"
    if prev: img.save(os.path.join(prev, f"{tag}-texture.png"))

def paint(img, color, k=1.3):
    px = np.array(img).astype(np.float32); a = px[:, :, 3] > 128
    l = px[:, :, :3] @ [0.299, 0.587, 0.114] / 255; ref = np.median(l[a]) if a.any() else 0.5
    f = np.clip(1 + (l - ref) * k / max(ref, 0.15), 0.45, 1.3)
    c = np.array(Image.new("RGB", (1, 1), color).getpixel((0, 0)), np.float32)
    px[:, :, :3] = np.clip(c[None, None, :] * f[:, :, None], 0, 255)
    return Image.fromarray(px.astype(np.uint8))

done_imgs = set()
for part, color in cfg.get("paint", {}).items():
    for mi, mn in enumerate(mats):
        if part not in mn: continue
        im, img = image_of(mi)
        if id(im) in done_imgs: continue
        done_imgs.add(id(im)); put_image(im, paint(img, color), part); print(f"paint: {mn} -> {color}")

keep_prims = []
for pr in body["primitives"]:
    mn = mats[pr["material"]]; idx = acc(pr["indices"]).reshape(-1, 3)
    if "_Shoes_" in mn and cfg.get("shoes", True) is False: continue          # barefoot
    if "_Tops_" in mn and cfg.get("tops", {}).get("cut") == "tee":
        T = cfg["tops"]; s = T.get("sleeve", 0.45)
        drop = np.zeros(len(P), bool)
        drop |= np.char.find(dom, "Hood") >= 0                                  # the hood and its strings
        for sd in "LR":
            sh, el = JP[f"J_Bip_{sd}_UpperArm"], JP[f"J_Bip_{sd}_LowerArm"]
            t, _ = seg_t(P, sh, el)
            arm = np.isin(dom, [f"J_Bip_{sd}_UpperArm", f"J_Bip_{sd}_LowerArm", f"J_Bip_{sd}_Hand"])
            drop |= arm & (t > s) | np.isin(dom, [f"J_Bip_{sd}_LowerArm", f"J_Bip_{sd}_Hand"])
        # the hood's collar: cloth above the neck base behind the head
        nk = JP["J_Bip_C_Neck"]; drop |= (P[:, 1] > nk[1] + T.get("collar", 0.03))
        idx = idx[~drop[idx].any(1)]
        if T.get("slim"):
            # pull the torso cloth in toward a vertical line through the spine (front-back more than sideways)
            tv = np.unique(idx); tv = tv[np.isin(dom[tv], ["J_Bip_C_Hips", "J_Bip_C_Spine", "J_Bip_C_Chest", "J_Bip_C_UpperChest", "J_Bip_L_UpperLeg", "J_Bip_R_UpperLeg"])]
            c = JP["J_Bip_C_Spine"]; k = 1 - T["slim"]
            moved[tv, 0] = c[0] + (P[tv, 0] - c[0]) * (1 - (1 - k) * 0.5)
            kz = np.where(P[tv, 2] > c[2], 1 - T.get("slimFront", T["slim"]), k)   # the belly side can take in more
            moved[tv, 2] = c[2] + (P[tv, 2] - c[2]) * kz
            # never inside the body: keep each corner at least `gap` outside the skin in its own direction
            sk = np.unique(acc(body["primitives"][0]["indices"])); sk = sk[np.isin(dom[sk], ["J_Bip_C_Hips", "J_Bip_C_Spine", "J_Bip_C_Chest", "J_Bip_C_UpperChest"])]; SK = P[sk]; gap = T.get("gap", 0.025)
            for v in tv:
                d = moved[v] - [c[0], moved[v, 1], c[2]]; r = np.linalg.norm(d[[0, 2]])
                if r < 1e-4: continue
                u = d / r; near = SK[np.abs(SK[:, 1] - moved[v, 1]) < 0.025]
                if not len(near): continue
                q = near - [c[0], 0, c[2]]; rq = np.linalg.norm(q[:, [0, 2]], axis=1)
                ok = (q[:, 0] * u[0] + q[:, 2] * u[2]) > 0.96 * rq
                if ok.any():
                    need = rq[ok].max() + gap
                    if r < need: moved[v, [0, 2]] = [c[0], c[2]] + u[[0, 2]] * need
        pr["indices"] = new_acc(idx.ravel(), pr["indices"], 34963)
        print(f"tops: kept {len(idx)} triangles (tee)")
    if "_Bottoms_" in mn and "bottoms" in cfg:
        B = cfg["bottoms"]; vs = np.unique(idx)
        for sd in "LR":
            hip, kn, an = JP[f"J_Bip_{sd}_UpperLeg"], JP[f"J_Bip_{sd}_LowerLeg"], JP[f"J_Bip_{sd}_Foot"]
            leg = vs[np.isin(dom[vs], [f"J_Bip_{sd}_UpperLeg", f"J_Bip_{sd}_LowerLeg", f"J_Bip_{sd}_Foot"])]
            q = P[leg]
            # axis point: on the thigh or the shin, whichever is nearer
            t1, a1 = seg_t(q, hip, kn); t2, a2 = seg_t(q, kn, an)
            use2 = np.linalg.norm(q - a2, axis=1) < np.linalg.norm(q - a1, axis=1)
            ax = np.where(use2[:, None], a2, a1); r = q - ax; r[:, 1] *= 0.15     # puff sideways, not up
            h = q[:, 1] - an[1]                                                # height above the ankle joint
            k = B.get("baggy", 1.3); cuff, cl = B.get("cuff", 1.02), B.get("cuffLen", 0.07)
            f = np.where(h < cl, cuff + (k - cuff) * np.clip(h / cl, 0, 1) ** 2, k)
            ramp = np.clip((hip[1] - 0.02 - q[:, 1]) / 0.12, 0, 1)                 # ease in below the crotch
            f = 1 + (f - 1) * ramp
            moved[leg] = ax + r * f[:, None]
            moved[leg, 1] = q[:, 1]                                            # heights stay exactly as modelled
        if "stripe" in B:
            S = B["stripe"]; im, img = image_of(pr["material"])
            Wd, Ht = img.size; px = np.array(img)
            # angle round the leg of each vertex: 0 = straight out to the side (the outer seam)
            ang = np.full(len(P), 999.0)
            for sd, sgn in (("L", 1), ("R", -1)):
                hip, an = JP[f"J_Bip_{sd}_UpperLeg"], JP[f"J_Bip_{sd}_Foot"]
                leg = vs[np.isin(dom[vs], [f"J_Bip_{sd}_UpperLeg", f"J_Bip_{sd}_LowerLeg", f"J_Bip_{sd}_Foot"])]
                ax = hip + (an - hip) * np.clip((P[leg, 1] - hip[1]) / (an[1] - hip[1]), 0, 1)[:, None]
                d = P[leg] - ax
                ang[leg] = np.degrees(np.arctan2(d[:, 2], sgn * d[:, 0]))
            ang[(P[:, 1] > JP["J_Bip_L_UpperLeg"][1] + 0.02)] = 999           # not on the waistband
            half = S.get("width", 7) / 2; col = np.array(Image.new("RGB", (1, 1), S["color"]).getpixel((0, 0)))
            painted = 0
            for tri in idx:
                a = ang[tri]
                if (np.abs(a) > half + 25).all() or (a > 900).any(): continue
                uv = UV[tri] * [Wd, Ht]
                x0, y0 = np.floor(uv.min(0)).astype(int); x1, y1 = np.ceil(uv.max(0)).astype(int)
                xs, ys = np.meshgrid(np.arange(max(0, x0), min(Wd, x1 + 1)), np.arange(max(0, y0), min(Ht, y1 + 1)))
                pts = np.stack([xs.ravel() + 0.5, ys.ravel() + 0.5], 1)
                T_ = np.array([uv[1] - uv[0], uv[2] - uv[0]]).T
                if abs(np.linalg.det(T_)) < 1e-9: continue
                bc = np.linalg.solve(T_, (pts - uv[0]).T).T; l1, l2 = bc[:, 0], bc[:, 1]; l0 = 1 - l1 - l2
                inside = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
                av = l0 * a[0] + l1 * a[1] + l2 * a[2]
                hit = inside & (np.abs(av) < half)
                X, Y = xs.ravel()[hit], ys.ravel()[hit]
                px[Y, X, :3] = col; painted += hit.sum()
            print(f"stripe: {painted} texels painted")
            put_image(im, Image.fromarray(px), "Bottoms-stripe")
    keep_prims.append(pr)
body["primitives"] = keep_prims
if (moved != P).any():
    pa = new_acc(moved, p0["attributes"]["POSITION"], 34962)
    for pr in body["primitives"]: pr["attributes"]["POSITION"] = pa
    print(f"bottoms: moved {(np.abs(moved - P).sum(1) > 1e-6).sum()} vertices, max {np.abs(moved - P).max() * 100:.1f} cm")

# VRM meta: say what this is
meta = J["extensions"]["VRM"]["meta"]; meta["title"] = cfg.get("title", meta.get("title")); meta["version"] = cfg.get("version", "")
J["buffers"][0]["byteLength"] = len(BIN)
js = json.dumps(J, separators=(",", ":")).encode()
js += b" " * (-len(js) % 4)
while len(BIN) % 4: BIN.append(0)
out = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(BIN)) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(BIN), 0x004E4942) + bytes(BIN)
open(dst, "wb").write(out); print(f"wrote {dst} ({len(out) / 1e6:.1f} MB)")
