"""Life masks for a layered painted environment (set "life", engine/page/set-life.js; Jonny 7 Nov 2026).

  python engine/plates/env_life.py <env> [<env> ...]      (or --all)

The sky card holds everything beyond the last depth band: the sky AND, in some paintings, the far landscape (the
lake and mountains of lakeside-campsite). Drifting the whole card slid the landscape with the clouds (Jonny 7 Nov:
"not just the clouds are moving but also the landscape"). And far trees (beyond swayMax) got no motion mask, so in a
storm they stood still. This writes, per card, a life mask in the card's own picture space:
  R  drift: the true sky (Depth Anything: the farthest pixels, connected to the top), feathered; only the sky card
  G  far sway: painted foliage (masks.foliage) on a card that has no motion mask of its own (far woods, hills,
     trees in the sky card), never on the true sky
and records it in env.json as card["life"]. Old storyboards don't read it (only set.life does)."""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from masks import foliage, grow  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))


def depth(img):
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    name = "depth-anything/Depth-Anything-V2-Small-hf"
    proc, model = AutoImageProcessor.from_pretrained(name), AutoModelForDepthEstimation.from_pretrained(name).eval()
    with torch.no_grad():
        pred = model(**proc(images=img, return_tensors="pt")).predicted_depth
    d = torch.nn.functional.interpolate(pred[:, None], size=img.size[::-1], mode="bicubic", align_corners=False)[0, 0].numpy()
    return (d - d.min()) / max(1e-9, d.max() - d.min())


def true_sky(img, d, tol=0.02, colour_tol=10):
    """the farthest pixels (inverse depth within tol of the sky's), connected to the top edge, as a soft 0..1 mask"""
    import cv2
    H, W = d.shape
    sky_d = float(np.percentile(d[: int(H * 0.25)], 5))
    cand = d < sky_d + tol
    # far but not sky (the distant sea, hills or a skyline in a gap between trees): the sky's own colours are learnt
    # from the top of the picture (blue, clouds, a sunset, stars) and a far pixel far from all of them is landscape
    lab = cv2.cvtColor((np.asarray(img).astype(np.float32) / 255), cv2.COLOR_RGB2LAB)
    top = cand.copy(); top[int(H * 0.25):] = False
    samp = lab[top].reshape(-1, 3)
    if len(samp) > 64:
        samp = samp[:: max(1, len(samp) // 20000)].astype(np.float32)
        _, _, cent = cv2.kmeans(samp, 8, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5), 2, cv2.KMEANS_PP_CENTERS)
        dist = np.min(np.linalg.norm(lab[..., None, :] - cent[None, None], axis=-1), axis=-1)
        cand &= dist < colour_tol
    cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    # the sky: the far, sky-coloured regions that touch the top edge; a darker cloud belly inside it (not in the
    # palette) is enclosed by sky on every side, so it is filled in
    n, lab_ = cv2.connectedComponents(cand.astype(np.uint8), connectivity=4)
    top_ids = np.unique(lab_[0][cand[0]])
    m = np.isin(lab_, top_ids[top_ids > 0])
    n2, lab2 = cv2.connectedComponents((~m).astype(np.uint8), connectivity=4)
    edge = set(np.unique(np.concatenate([lab2[-1], lab2[:, 0], lab2[:, -1]])).tolist())
    holes = ~m & ~np.isin(lab2, list(edge))
    m = (m | holes).astype(np.uint8)
    # a lone column running further down than its neighbours (a sliver between two towers) is no sky: an opening as
    # wide as 3 % of the picture removes it
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((1, max(3, W // 33)), np.uint8)).astype(float)
    # pull it back from the landscape a little, then feather (a cloud slides behind a ridge, never across it)
    r = max(2, W // 150)
    m = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255


def run(env):
    dirn = os.path.join(ROOT, "assets/environments", env)
    E = json.load(open(os.path.join(dirn, "env.json")))
    img = Image.open(os.path.join(dirn, "paint.png")).convert("RGB")
    w, h = img.size
    W, H = E["size"]; PX, PY = E["pad"]
    k = W / w   # the env's picture is the painting at k times its size
    d = depth(img)
    sky = true_sky(img, d)
    leaf = np.clip(grow(foliage(img, w / 1000), max(2, w // 200)) * 1.5, 0, 1) * (1 - sky)
    big = lambda a: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(float) / 255
    sky_b, leaf_b = big(sky), big(leaf)
    ext = lambda a: np.pad(a, [(PY, PY), (PX, PX)], mode="reflect")
    sky_p, leaf_p = ext(sky_b), ext(leaf_b)
    # what the other cards cover is landscape (hills, woods, towers): the sky never drifts there, so nothing of it is
    # dragged into the open sky either
    ph, pw = H + 2 * PY, W + 2 * PX
    cover = np.zeros((ph, pw))
    for c in E["cards"]:
        if c.get("sky"): continue
        x0, y0, x1, y1 = c["rect"]
        a = np.asarray(Image.open(os.path.join(dirn, c["src"])).convert("RGBA"))[..., 3].astype(float) / 255
        cover[y0 + PY:y1 + PY, x0 + PX:x1 + PX] = np.maximum(cover[y0 + PY:y1 + PY, x0 + PX:x1 + PX], a > 0.5)
    sky_p = sky_p * (1 - grow(cover, max(2, W // 300)).clip(0, 1))
    made = []
    for i, c in enumerate(E["cards"]):
        x0, y0, x1, y1 = c["rect"]
        sl = (slice(y0 + PY, y1 + PY), slice(x0 + PX, x1 + PX))
        card = Image.open(os.path.join(dirn, c["src"]))
        alpha = np.asarray(card.convert("RGBA"))[..., 3].astype(float) / 255
        R = sky_p[sl] if c.get("sky") else np.zeros_like(alpha)
        G = leaf_p[sl] * (alpha > 0.5) if not c.get("motion") else np.zeros_like(alpha)
        if R.shape != alpha.shape:
            raise SystemExit(f"{env} {c['name']}: card {alpha.shape} vs mask {R.shape}")
        if R.max() < 0.05 and G.max() < 0.05:
            c.pop("life", None); continue
        fn = f"layer-{i}-{c['name']}.life.png"
        mk = Image.fromarray((np.dstack([R, G, np.zeros_like(R)]) * 255).astype(np.uint8))
        mk.resize((max(1, mk.width // 2), max(1, mk.height // 2)), Image.BILINEAR).save(os.path.join(dirn, fn), optimize=True)   # soft masks: half size is plenty
        c["life"] = fn; made.append(f"{c['name']} (sky {R.mean():.2f}, leaves {G.mean():.2f})")
    json.dump(E, open(os.path.join(dirn, "env.json"), "w"), indent=1)
    # a review picture: the painting, the sky that drifts in blue, the far leaves that sway in red
    rv = np.asarray(img).astype(float) / 255 * 0.6
    skyv = np.asarray(Image.fromarray((sky_p[PY:PY + H, PX:PX + W] * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(float) / 255
    rv[..., 2] += skyv * 0.5; rv[..., 0] += leaf * 0.4
    Image.fromarray((np.clip(rv, 0, 1) * 255).astype(np.uint8)).resize((w // 2, h // 2)).save(os.path.join(dirn, "life-review.jpg"), quality=85)
    print(env, "->", ", ".join(made) or "nothing")


if __name__ == "__main__":
    names = sys.argv[1:]
    if names == ["--all"]:
        names = sorted(n for n in os.listdir(os.path.join(ROOT, "assets/environments")) if os.path.exists(os.path.join(ROOT, "assets/environments", n, "env.json")))
    for n in names: run(n)
