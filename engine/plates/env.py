# A layered painted environment (engine/page/set-env.js): one hand-painted picture of a place, cut into the
# layers an anime background artist would paint on separate cels (multiplane): the sky, far hills, a middle band of
# trees, near objects, and the ground the characters walk on. One picture means one palette and one light for every
# layer; the cut gives true parallax when the camera moves, and the ground becomes a real 3D floor (y 0) carrying the
# painting, so feet, shadows and props touch the painted path where it is.
#
#   python engine/plates/env.py assets/environments/<name>/spec.json [paint] [refine] [split]   (no stage = all)
#
# Stages (each writes next to spec.json; later stages read what earlier ones wrote, so one can be redone alone):
#   paint   SDXL base + Lightning LoRA on the CPU (engine/plates/paint.py's free models): paint.png. Seeds are
#           listed in spec.seeds; the first is used (paint several, look, put the best first).
#   refine  2x: Lanczos, then a light SDXL image-to-image pass in overlapping 1024 tiles that repaints the brush work
#           at the new size (strength spec.refine, 0 = plain resize): paint-hi.png. The video is 1080x1920, and a
#           shot sees about 80 % of the picture's height, so the picture needs ~2400 px of height to stay sharp.
#   split   depth (Depth Anything V2 Small) -> metres, the horizon and the painting camera; each pixel sorted into
#           sky, ground or a depth band; one RGBA picture per layer with its hidden part filled; motion masks per
#           layer (engine/plates/masks.py); palette; env.json (what set-env.js and qa/env.mjs read); review.png.
#
# How the picture becomes metres (no guessing per pixel): the ground of a picture painted at eye level is a plane.
# On a plane seen from height h the inverse depth 1/Z grows linearly with the picture row, and Depth Anything's output
# is an affine copy of inverse depth (a/Z + b). So a straight line fitted to the depth of the lower rows gives the
# horizon (where 1/Z reaches the sky's value) and the scale a; the eye height comes from the spec (the cast's eye
# level). From there every pixel has a distance, and a pixel is "ground" when its distance matches the ground plane at
# its row, "standing" (a tree, a rock, a fence) when it is nearer than the plane there.
import json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from masks import motion_masks, review as mask_review, ramp, grow

NEG = ("people, person, character, animal, text, watermark, logo, signature, frame, border, 3d render, cgi, "
       "photo, photorealistic, blurry, lowres, deformed, oversaturated, harsh contrast")


def load_spec(path):
    S = json.load(open(path))
    S["_dir"] = os.path.dirname(os.path.abspath(path))
    return S


def out(S, name): return os.path.join(S["_dir"], name)


# ------------------------------------------------------------------------------------------------ paint + refine
def pipes(img2img=False):
    import torch
    from diffusers import StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline, EulerDiscreteScheduler
    torch.set_num_threads(os.cpu_count() or 4)
    pipe = StableDiffusionXLPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
    pipe.load_lora_weights("ByteDance/SDXL-Lightning", weight_name="sdxl_lightning_8step_lora.safetensors"); pipe.fuse_lora()
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
    return StableDiffusionXLImg2ImgPipeline(**pipe.components) if img2img else pipe


def paint(S):
    import torch, time
    W, H = map(int, S.get("size", "896x1344").split("x"))
    pipe = pipes()
    for i, seed in enumerate(S.get("seeds", [1])):
        if i and not S.get("all_seeds"): break
        t = time.time()
        img = pipe(S["prompt"], negative_prompt=NEG + (", " + S["no"] if S.get("no") else ""), num_inference_steps=8,
                   guidance_scale=0, width=W, height=H, generator=torch.Generator().manual_seed(seed)).images[0]
        f = out(S, "paint.png" if i == 0 else f"paint-seed{seed}.png")
        img.save(f); print("wrote", f, round(time.time() - t), "s", flush=True)


def refine(S):
    import torch
    src = Image.open(out(S, "paint.png")).convert("RGB")
    k = S.get("upscale", 2)
    big = src.resize((src.width * k, src.height * k), Image.LANCZOS)
    st = S.get("refine", 0)
    if st <= 0:   # a plain Lanczos 2x with a light unsharp mask keeps the brush edges crisp (the 4 Nov test: the SDXL
        # tile pass at 0.3 softened the leaves and clouds instead of adding detail, so it is off by default)
        big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2)).save(out(S, "paint-hi.png")); print("wrote", out(S, "paint-hi.png")); return
    pipe = pipes(img2img=True)
    T, O = 1024, 192   # tile and overlap
    W, H = big.size
    xs = list(range(0, max(1, W - T) + 1, T - O)); ys = list(range(0, max(1, H - T) + 1, T - O))
    if xs[-1] + T < W: xs.append(W - T)
    if ys[-1] + T < H: ys.append(H - T)
    acc = np.zeros((H, W, 3)); wsum = np.zeros((H, W, 1))
    ramp1 = np.minimum(1, np.minimum(np.arange(T) + 1, T - np.arange(T)) / O)
    wt = (ramp1[None, :] * ramp1[:, None])[..., None]
    n = 0
    for y in ys:
        for x in xs:
            tile = big.crop((x, y, x + T, y + T))
            r = pipe(S["prompt"], negative_prompt=NEG, image=tile, strength=st, num_inference_steps=8, guidance_scale=0,
                     generator=torch.Generator().manual_seed(S.get("seeds", [1])[0] + n)).images[0]
            acc[y:y + T, x:x + T] += np.asarray(r).astype(float) * wt; wsum[y:y + T, x:x + T] += wt
            n += 1; print(f"refined tile {n}/{len(xs) * len(ys)}", flush=True)
    Image.fromarray(np.clip(acc / np.maximum(wsum, 1e-6), 0, 255).astype(np.uint8)).save(out(S, "paint-hi.png"))
    print("wrote", out(S, "paint-hi.png"))


# ------------------------------------------------------------------------------------------------ split
def depth_map(img):
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    name = "depth-anything/Depth-Anything-V2-Small-hf"
    proc, model = AutoImageProcessor.from_pretrained(name), AutoModelForDepthEstimation.from_pretrained(name).eval()
    with torch.no_grad():
        pred = model(**proc(images=img, return_tensors="pt")).predicted_depth
    d = torch.nn.functional.interpolate(pred[:, None], size=img.size[::-1], mode="bicubic", align_corners=False)[0, 0].numpy()
    return d.astype(np.float64)


def pull_push(rgb, m, k=4):
    """pull_push at 1/k size (the fill is a smooth wash anyway), known pixels kept exact"""
    if k > 1 and min(m.shape) > 64 * k:
        H, W = m.shape
        small = lambda a: np.asarray(Image.fromarray(a.astype(np.float32), mode="F").resize((W // k, H // k), Image.BOX)) if a.ndim == 2 else np.dstack([small(a[..., c]) for c in range(a.shape[-1])])
        ms = small(m.astype(float)); cs = small(rgb * m[..., None]) / np.maximum(ms, 1e-6)[..., None]
        fs = _pull_push(cs, (ms > 0.5).astype(float))
        up = np.dstack([np.asarray(Image.fromarray(fs[..., c].astype(np.float32), mode="F").resize((W, H), Image.BILINEAR)) for c in range(fs.shape[-1])])
        return np.where(m[..., None] > 0.5, rgb, up)
    return _pull_push(rgb, m)


def _pull_push(rgb, m):
    """fill the unknown pixels (m 0) from the known ones (m 1) by a pyramid average: smooth colour that carries the
    surroundings into the hole, the way a painter would continue the wall behind a tree"""
    levels = []
    c, w = rgb * m[..., None], m.astype(float)
    while max(w.shape) > 1:
        levels.append((c, w))
        h2, w2 = (w.shape[0] + 1) // 2, (w.shape[1] + 1) // 2
        pad = lambda a: np.pad(a, [(0, h2 * 2 - a.shape[0]), (0, w2 * 2 - a.shape[1])] + [(0, 0)] * (a.ndim - 2), mode="edge")
        cc, ww = pad(c), pad(w)
        c = cc.reshape(h2, 2, w2, 2, -1).sum((1, 3)); w = ww.reshape(h2, 2, w2, 2).sum((1, 3))
    col = c / np.maximum(w, 1e-6)[..., None]
    if not (w > 0).all(): col[w <= 0] = (rgb * m[..., None]).reshape(-1, rgb.shape[-1]).sum(0) / max(1e-6, m.sum())
    for c0, w0 in reversed(levels):
        up = np.repeat(np.repeat(col, 2, 0), 2, 1)[: w0.shape[0], : w0.shape[1]]
        up = np.asarray(Image.fromarray(np.clip(up * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(float) / 255
        a = np.clip(w0, 0, 1)[..., None]
        col = c0 / np.maximum(w0, 1e-6)[..., None] * a + up * (1 - a)
    return col


def soft(m, r):
    return np.asarray(Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255


def _k(r):
    import cv2
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def dilate(m, r):
    import cv2
    if r <= 0: return m
    return cv2.dilate((m > 0.5).astype(np.uint8), _k(r)).astype(float)


def erode(m, r):
    import cv2
    if r <= 0: return m
    return cv2.erode((m > 0.5).astype(np.uint8), _k(r)).astype(float)


def open_close(m, r):
    """drop specks and fill pinholes (depth edges are noisy one or two pixels wide)"""
    return erode(dilate(dilate(erode(m, r), r), r), r)


def kmeans_palette(rgb, k=8, seed=1):
    px = rgb.reshape(-1, 3)[:: max(1, rgb.size // 3 // 40000)]
    rs = np.random.RandomState(seed)
    c = px[rs.choice(len(px), k, replace=False)]
    for _ in range(25):
        lab = ((px[:, None] - c[None]) ** 2).sum(-1).argmin(1)
        c = np.array([px[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
    share = np.bincount(lab, minlength=k) / len(lab)
    order = np.argsort(-share)
    hexes = ["#%02x%02x%02x" % tuple(int(round(v * 255)) for v in c[i]) for i in order]
    return [{"color": h, "share": round(float(share[i]), 3)} for h, i in zip(hexes, order)]


def border_profile(a, n=24):
    """alpha along each picture edge (n samples, 0..1): qa/env.mjs uses it to know whether a layer's edge would show"""
    H, W = a.shape
    samp = lambda v: [round(float(v[int(i * (len(v) - 1) / (n - 1))]), 2) for i in range(n)]
    band = max(2, W // 200)
    return {"top": samp(a[:band].max(0)), "bottom": samp(a[-band:].max(0)), "left": samp(a[:, :band].max(1)), "right": samp(a[:, -band:].max(1))}


def objects(S, Zs, Zg, sky, ground_3d, B, W, H):
    """the standing pixels as whole objects, each on one card: a tree is one tree, not a trunk on one layer and the
    leaf edges (where the depth model blurs into the sky) on another. Objects are regions of smooth depth: neighbours
    join unless the depth jumps (a trunk in front of the hills). An object that stands on the painted floor hangs at the
    floor's distance where it meets it (a tree is as far as its foot, whatever the depth model says about its crown);
    one that stands on nothing painted (far hills) at its median depth. -> [(name, mask, z, is_sky)], far to near."""
    import cv2
    stand = ~sky & ~ground_3d
    # the depth model blurs an object's edge into what is behind it (a leaf against the hills reads half way): each
    # pixel takes the nearest depth round it, so a tree's fringe stays with the tree (and keeps a thin halo of hill)
    r = max(2, int(W * S.get("edgePull", 0.008)))
    Zf = cv2.erode(np.where(stand, np.minimum(Zs, 1e4), 1e4).astype(np.float32), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    bi = np.digitize(Zf, B)   # 0: nearer than B[0] ... len(B): beyond the last
    lab = np.zeros((H, W), np.int32); n = 1
    for k in range(len(B) + 1):
        nk, lk = cv2.connectedComponents((stand & (bi == k)).astype(np.uint8), connectivity=4)
        lab = np.where(lk > 0, lk + n - 1, lab); n += nk - 1
    n = int(lab.max()) + 1
    area = np.bincount(lab.ravel(), minlength=n)
    tiny = max(30, int(W * H * S.get("minObject", 0.0015)))
    small = area < tiny; small[0] = True
    lab[small[lab]] = 0
    for _ in range(int(W * 0.08)):
        todo = stand & (lab == 0)
        if not todo.any(): break
        grown = cv2.dilate(lab.astype(np.float32), np.ones((3, 3), np.uint8)).astype(lab.dtype)
        lab = np.where(todo & (grown > 0), grown, lab)
    ids = [i for i in np.unique(lab) if i > 0]
    out = []
    rows = np.arange(H)[:, None] + np.zeros((1, W), int)
    below = np.zeros_like(ground_3d); below[:-6] = ground_3d[6:]   # floor just under a pixel
    for i in ids:
        m = lab == i
        foot = m & below
        if foot.sum() > W * 0.01:   # stands on the painted floor: as far as its foot
            z = float(np.median(Zg[foot]))
        else:
            k = int(np.median(bi[m])); lo, hi = ([0] + list(B) + [S.get("skyZ", 240) * 0.8])[k:k + 2]
            z = float(np.clip(np.median(Zs[m]), lo, hi))
        z = min(max(z, 0.6), S.get("skyZ", 240) * 0.8)
        # where each column of it meets the floor: a bank along the road is as far as the road's edge in every column,
        # so its card follows the edge (a curved fence) and its foot sits on the floor from any camera
        colfoot = np.full(W, np.nan)
        cols = np.where(foot.any(0))[0]
        if len(cols):
            last = H - 1 - np.argmax(foot[::-1, cols], axis=0)
            colfoot[cols] = Zg[last, cols]
        out.append([m, z, colfoot if np.isfinite(colfoot).sum() > W * 0.02 else None])
    for f_ in S.get("force", []):   # {"box": [x0, y0, x1, y1], "z": metres}: a hand-set distance for an odd spot
        x0, y0, x1, y1 = f_["box"]; m = np.zeros((H, W), bool); m[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = True
        m &= stand
        for o in out: o[0] = o[0] & ~m
        out.append([m, float(f_["z"]), None])
    out = [o for o in out if o[0].any()]
    out.sort(key=lambda o: -o[1])
    names = S.get("names", ["near", "mid", "far", "hills"])
    band = lambda z: names[min(len(names) - 1, sum(z >= b for b in B[:-1]))]
    res, count = [("sky", sky.copy(), S.get("skyZ", 240), True, None)], {}
    for m, z, colfoot in out:
        nm = band(z); count[nm] = count.get(nm, 0) + 1
        res.append((f"{nm}-{count[nm]}", m, z, False, colfoot))
    return res


def split(S):
    import glob
    for f in glob.glob(out(S, "layer-*")): os.remove(f)   # a new cut can have other layers
    src = out(S, "paint-hi.png") if os.path.exists(out(S, "paint-hi.png")) else out(S, "paint.png")
    img = Image.open(src).convert("RGB")
    W, H = img.size
    rgb = np.asarray(img).astype(float) / 255
    E = S.get("eye", {})
    h = E.get("height", 0.95)          # eye height (m): the cast's eye level
    vfov = E.get("vfov", 46)           # the painting's vertical field of view (deg)
    f = (H / 2) / math.tan(math.radians(vfov) / 2)
    dcache = out(S, "depth.npy")
    if os.path.exists(dcache) and os.path.getmtime(dcache) > os.path.getmtime(src): d = np.load(dcache)
    else:
        small = img.resize((W // 2, H // 2), Image.LANCZOS)   # Depth Anything works at ~518 px anyway
        d = np.asarray(Image.fromarray(depth_map(small).astype(np.float32), mode="F").resize((W, H), Image.BICUBIC)).astype(np.float64)
        np.save(dcache, d)
    d = (d - d.min()) / max(1e-9, d.max() - d.min())

    # --- the ground plane: inverse depth is linear in the row on the lower rows (median of the middle columns)
    rows = np.arange(H)
    lo, hi = int(H * S.get("groundRows", [0.72, 0.98])[0]), int(H * S.get("groundRows", [0.72, 0.98])[1])
    cols = slice(int(W * 0.25), int(W * 0.75))
    med = np.median(d[lo:hi, cols], axis=1)
    A = np.vstack([rows[lo:hi], np.ones(hi - lo)]).T
    (al, be), *_ = np.linalg.lstsq(A, med, rcond=None)
    sky_d = float(np.percentile(d[: int(H * 0.25)], 5))   # the sky: farthest (smallest inverse depth)
    v_h = (sky_d - be) / al
    if "horizon" in E: v_h = E["horizon"] * H; print("horizon from spec")
    if not (0.15 * H < v_h < 0.75 * H):
        print(f"horizon fit {v_h / H:.2f} out of range, using 0.5"); v_h = 0.5 * H
    pitch = math.atan((H / 2 - v_h) / f)   # + looks down
    a_scale = al * h * f / math.cos(pitch)
    print(f"horizon at {v_h / H:.3f} of the height, pitch {math.degrees(pitch):.2f} deg down, depth scale {a_scale:.1f}")

    # every pixel's distance along the painting camera's view axis (metres)
    inv = np.clip((d - sky_d) / a_scale, 1e-5, None)
    Z = 1 / inv
    yc = -(rows[:, None] - H / 2) + np.zeros((1, W))
    inv_ground = (f * math.sin(pitch) - yc * math.cos(pitch)) / (h * f)   # 1/Z of the ground plane at each pixel
    Zg = np.where(inv_ground > 1e-6, 1 / np.maximum(inv_ground, 1e-6), np.inf)

    B = S.get("bands", [3.0, 9.0, 28.0, 90.0])   # metres: near | mid | far | hills | sky (beyond the last)
    gmax = S.get("groundMax", B[-2])             # the 3D ground ends here; farther ground goes into the cards
    sky = (Z > S.get("skyFrom", B[-1])) | (rows[:, None] < v_h - 2) & (d < sky_d + 0.02)
    # sky pixels round a tree's crown are often leaf fringe the depth model blurred toward the sky: they go with the tree
    # (as a thin halo of sky colour that moves with it) so the sky card stays clean blue where the trees are lifted off
    import cv2
    rr = max(2, int(W * S.get("edgePull", 0.008)))
    near_obj = cv2.dilate(((~sky) & (rows[:, None] < v_h) | (~sky & (Z < Zg * S.get("standRatio", 0.82)))).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rr + 1, 2 * rr + 1))) > 0
    sky = sky & ~near_obj
    standing = (Z < Zg * S.get("standRatio", 0.82)) & ~sky
    ground = ~sky & ~standing & (Zg < np.inf)
    ground_3d = ground & (Zg <= gmax)
    # clean the classes: no single-pixel specks
    r = max(1, W // 600)
    standing = open_close(standing.astype(float), r) > 0.5
    ground_3d = (open_close(ground_3d.astype(float), r) > 0.5) & ~standing
    # distance for card sorting: standing pixels by their own depth; far ground and hills by theirs; sky by the last band
    Zs = np.where(sky, np.inf, Z)
    layers = objects(S, Zs, Zg, sky, ground_3d, B, W, H)
    pad = S.get("pad", 0.18)   # the picture extended this share of its width on each side (camera room)
    PX = int(round(W * pad)); PY = int(round(H * S.get("padY", 0.08)))
    pw, ph = W + 2 * PX, H + 2 * PY
    extend = lambda a: np.pad(a, [(PY, PY), (PX, PX)] + [(0, 0)] * (a.ndim - 2), mode="reflect")   # mirrored margin: grass and sky continue without streaks
    rgbp = extend(rgb)
    cards, motion_all = [], np.zeros((H, W, 3))
    ov = S.get("motion", {})
    sway, shimmer, still = motion_masks(img, ov, scale=W / 1000)
    fill_px = int(round(W * S.get("fill", 0.03)))   # how far each layer continues under the ones in front
    after = [np.zeros((H, W), bool)]   # after[k]: everything nearer than layer k (the layers come far to near)
    for _, m, _, _, _ in reversed(layers): after.insert(0, after[0] | m)
    layer = np.full((H, W), -1)
    for i, (lname, m, Zi, is_sky, colfoot) in enumerate(layers):
        nearer = after[i + 1]
        layer[m & ~ground_3d] = i
        if is_sky: alpha = np.ones((H, W))
        else:
            hidden = dilate(m.astype(float), fill_px) * nearer   # continues behind what stands in front of it
            alpha = np.clip(soft(m.astype(float), 1.0) + hidden, 0, 1)
            alpha = np.maximum(alpha, m)
        col = pull_push(rgb, m.astype(float))
        col = np.where(m[..., None], rgb, col)
        # the sky continues mirrored past the picture; a near tree or bank doesn't (a mirrored twin tree reads as fake):
        # it ends at the picture edge, and qa/env.mjs fails a camera that would show that cut.
        # far hills and woods have no shape the eye checks, so they continue mirrored like the sky (from mirrorFrom m)
        mirror = is_sky or Zi >= S.get("mirrorFrom", 20)
        A_ = extend(alpha) if mirror else np.pad(alpha, [(PY, PY), (PX, PX)]); C_ = np.clip(extend(col), 0, 1)
        crop = np.argwhere(A_ > 0.004)
        y0, x0 = crop.min(0); y1, x1 = crop.max(0) + 1
        y0, x0 = max(0, y0 - 4), max(0, x0 - 4); y1, x1 = min(ph, y1 + 4), min(pw, x1 + 4)
        rgba = np.dstack([C_, A_])[y0:y1, x0:x1]
        fn = f"layer-{i}-{lname}.webp"
        Image.fromarray((rgba * 255).round().astype(np.uint8), "RGBA").save(out(S, fn), quality=S.get("quality", 92), method=4)
        # motion per layer: foliage sways on its own layer only (a tree's card, the meadow's ground)
        # far away (hills, the sky) nothing visibly sways: a leaf's sway is a few centimetres
        moves = not is_sky and Zi <= S.get("swayMax", 30)
        mo = np.dstack([sway * m, shimmer * m, np.zeros((H, W))]) * moves
        if moves and mo[..., 0].max() > 0.05:
            mo_p = extend(mo)[y0:y1, x0:x1]
            mfn = f"layer-{i}-{lname}.motion.png"
            Image.fromarray((mo_p * 255).astype(np.uint8)).save(out(S, mfn))
        else: mfn = None
        motion_all += mo
        foot = None
        cf = None if colfoot is None else np.pad(colfoot, (PX, PX), mode="reflect")[x0:x1]
        if cf is not None and np.isfinite(cf).any():   # 48 samples across the card, gaps from the nearest foot
            ok = np.isfinite(cf)
            cf = np.interp(np.arange(len(cf)), np.where(ok)[0], cf[ok])
            # smooth along the card (a window of an eighth of its width): a column-by-column foot shears the tree
            # crowns above it into zigzags; a bank's edge bends slowly anyway
            w = max(3, len(cf) // 16)
            k = (np.arange(48) * (len(cf) - 1) / 47).astype(int)
            med = np.array([np.median(cf[max(0, j - w): j + w + 1]) for j in k])
            sm = np.convolve(np.pad(med, 3, mode="edge"), np.ones(7) / 7, mode="valid")
            foot = [round(float(min(max(v, 0.6), Zi * 3)), 3) for v in sm]
        ga = rgba[..., 3]; gh, gw = max(4, round(32 * ga.shape[0] / max(1, ga.shape[1]))), 32
        small = np.asarray(Image.fromarray((ga * 255).astype(np.uint8)).resize((gw, gh), Image.BOX)) > 127
        cards.append({"name": lname, "foot": foot, "mask": ["".join("1" if b else "0" for b in row) for row in small], "src": fn, "motion": mfn, "z": round(Zi, 3), "rect": [int(x0 - PX), int(y0 - PY), int(x1 - PX), int(y1 - PY)],
                      "sky": is_sky, "share": round(float(m.mean()), 4), "fill": 0 if is_sky else fill_px,
                      "border": border_profile(rgba[..., 3])})
        print(f"layer {i} {lname}: {m.mean() * 100:.1f} % of the picture at {Zi:.1f} m", flush=True)

    # the ground: the picture with everything standing on it painted out, carried on the 3D floor
    gm = ground_3d.astype(float)
    gcol = np.where(ground_3d[..., None], rgb, pull_push(rgb, gm))
    gfn = "ground.webp"
    Image.fromarray((np.clip(extend(gcol), 0, 1) * 255).round().astype(np.uint8)).save(out(S, gfn), quality=S.get("quality", 92), method=4)
    gmo = extend(np.dstack([sway * ground_3d, shimmer * ground_3d, np.zeros((H, W))]))
    Image.fromarray((gmo * 255).astype(np.uint8)).save(out(S, "ground.motion.png"))
    motion_all += np.dstack([sway * ground_3d, shimmer * ground_3d, np.zeros((H, W))])
    # the farthest row the 3D floor reaches (above it the cards take over)
    # the row where the ground plane is gmax away: 1/gmax = (f sin p - yc cos p) / (h f)
    yc_far = (f * math.sin(pitch) - h * f / gmax) / math.cos(pitch)
    v_far = H / 2 - yc_far

    pal = kmeans_palette(rgb, S.get("paletteSize", 8))
    L = S.get("light", {})
    env = {
        "name": S.get("name", os.path.basename(S["_dir"])), "source": os.path.basename(src), "size": [W, H], "pad": [PX, PY],
        "eye": {"pos": E.get("pos", [0, h, 4.4]), "height": h, "vfov": vfov, "pitch": round(math.degrees(pitch), 3), "f": round(f, 2),
                "horizon": round(v_h / H, 4)},
        "ground": {"src": gfn, "motion": "ground.motion.png", "far": gmax, "row": round(v_far / H, 4), "share": round(float(ground_3d.mean()), 4)},
        "cards": cards,
        "palette": pal,
        "light": {"key": L.get("key", [-4.0, 5.0, 3.0]), "from": L.get("from", ""), "shadow": L.get("shadow", 0.32), "tint": L.get("tint")},
        "sway": S.get("sway", 1.0), "surface": S.get("surface", "grass"),
        "camera": S.get("camera", {}),
    }
    json.dump(env, open(out(S, "env.json"), "w"), indent=1)
    print("wrote", out(S, "env.json"))
    # ---- review sheet: painting | depth | classes | sway mask | exploded layers
    sheet(S, img, d, layer, ground_3d, motion_all, cards, ov, v_h, v_far)


def sheet(S, img, d, layer, ground_3d, motion_all, cards, ov, v_h, v_far):
    from PIL import ImageDraw
    W, H = img.size
    tw = 360; th = int(H * tw / W)
    tiles = []
    tiles.append(("painting", img))
    dm = (np.clip(d, 0, 1) * 255).astype(np.uint8)
    tiles.append(("depth (white near)", Image.fromarray(dm).convert("RGB")))
    cols = np.array([[230, 80, 60], [240, 170, 50], [120, 190, 80], [90, 140, 220], [170, 120, 220], [200, 220, 240], [250, 250, 250]])
    cls = np.zeros((H, W, 3), np.uint8)
    for i in range(len(cards) + 2):
        cls[layer == i] = [200, 220, 240] if i == 0 else (np.array(__import__('colorsys').hsv_to_rgb((i * 0.618) % 1, 0.65, 0.95)) * 255).astype(int)
    cls[ground_3d] = [140, 100, 60]
    tiles.append(("layers (brown = 3D ground)", Image.fromarray(cls)))
    mr = os.path.join(S["_dir"], "_mask.png")
    mask_review(img, np.clip(motion_all[..., 0], 0, 1), np.clip(motion_all[..., 1], 0, 1), ov.get("still"), mr)
    tiles.append(("sway red / shimmer yellow / still cyan", Image.open(mr)))
    os.remove(mr)
    for c in cards:
        im = Image.open(out(S, c["src"])).convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        chk = np.indices(im.size[::-1]).sum(0) // 24 % 2
        bg = Image.fromarray(np.where(chk[..., None] == 1, 200, 235).astype(np.uint8).repeat(3, 2)).convert("RGBA")
        tiles.append((f"{c['name']} at {c['z']} m", Image.alpha_composite(bg, im).convert("RGB")))
    g = Image.open(out(S, "ground.webp")).convert("RGB")
    tiles.append((f"ground (3D floor to {S.get('groundMax', 28)} m)", g))
    n = len(tiles); per = 5; rows_n = (n + per - 1) // per
    sh = Image.new("RGB", (per * (tw + 10) + 10, rows_n * (th + 40) + 10), (30, 30, 34))
    dr = ImageDraw.Draw(sh)
    for k, (name, im) in enumerate(tiles):
        x = 10 + (k % per) * (tw + 10); y = 10 + (k // per) * (th + 40)
        im2 = im.copy(); im2.thumbnail((tw, th))
        sh.paste(im2, (x, y + 24)); dr.text((x, y + 6), name, fill=(235, 235, 235))
        if k < 4:   # horizon and the 3D floor's far row
            yy = y + 24 + v_h * im2.height / H; dr.line([x, yy, x + im2.width, yy], fill=(255, 60, 200), width=1)
            yy = y + 24 + v_far * im2.height / H; dr.line([x, yy, x + im2.width, yy], fill=(60, 255, 200), width=1)
    sh.save(out(S, "review.png")); print("wrote", out(S, "review.png"))


if __name__ == "__main__":
    S = load_spec(sys.argv[1])
    stages = sys.argv[2:] or ["paint", "refine", "split"]
    for st in stages: {"paint": paint, "refine": refine, "split": split}[st](S)
