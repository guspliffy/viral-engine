#!/usr/bin/env python3
"""Look check for the trend scout (Jonny 26 Nov: "does the engine actually check the video? ... some videos on the website
we wouldn't fit in"). Reads each video's cover image and asks a small free CLIP model (ONNX, CPU, about 0.3 s an image)
which look it has: 3D cartoon, 2D cartoon, stick figures (our kind) or real people, selfie video, game footage, anime,
text. fit = the share for our kinds (0-1). Covers only: a cover can mislead, so the page hides, never deletes.

  printf 'url\timage|image|image\n' | python3 tools/look-check.py [model_dir]   ->  {url: {fit, look, frames}} on stdout
Each image is a URL or a local file (frames from inside the video, Jonny 26 Nov: a cover can mislead); the shares are
averaged over the images that load.
Needs: pip install onnxruntime numpy pillow tokenizers. The model (~155 MB, Xenova/clip-vit-base-patch32, MIT) is
downloaded into model_dir (default ~/.cache/look-model) on first use.
"""
import json, os, sys, io, urllib.request, numpy as np, onnxruntime as ort
from PIL import Image
from tokenizers import Tokenizer
D = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/.cache/look-model")
os.makedirs(D, exist_ok=True)
for f in ["onnx/vision_model_quantized.onnx", "onnx/text_model_quantized.onnx", "tokenizer.json"]:
    p = os.path.join(D, os.path.basename(f))
    if not os.path.exists(p):
        urllib.request.urlretrieve(f"https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/main/{f}", p + ".part"); os.replace(p + ".part", p)
LABELS = {"3d": "a 3D animated cartoon character", "2d": "a 2D cartoon animation drawing", "stick": "a simple stick figure animation",
  "real": "a photo of a real person", "selfie": "a real person filming themselves with a phone", "game": "video game footage screenshot",
  "anime": "an anime screenshot", "text": "a screenshot of text on a plain background"}
FIT = {"3d", "2d", "stick"}
tok = Tokenizer.from_file(f"{D}/tokenizer.json")
txt = ort.InferenceSession(f"{D}/text_model_quantized.onnx"); vis = ort.InferenceSession(f"{D}/vision_model_quantized.onnx")
ids = [tok.encode(t).ids[:77] for t in LABELS.values()]; L = max(map(len, ids))
inp = np.array([i + [49407] * (L - len(i)) for i in ids], dtype=np.int64)
names = [i.name for i in txt.get_inputs()]
feeds = {"input_ids": inp}
if "attention_mask" in names: feeds["attention_mask"] = (np.arange(L)[None] < np.array([len(i) for i in ids])[:, None]).astype(np.int64)
tout = txt.run(None, feeds); T = [o for o, m in zip(tout, txt.get_outputs()) if "embed" in m.name][0]
T = T / np.linalg.norm(T, axis=1, keepdims=True)
mean, std = np.array([0.4815, 0.4578, 0.4082]), np.array([0.2686, 0.2613, 0.2758])
def prep(im):
    im = im.convert("RGB"); w, h = im.size; s = 224 / min(w, h); im = im.resize((round(w * s), round(h * s)), Image.BICUBIC)
    w, h = im.size; l, t = (w - 224) // 2, (h - 224) // 2; a = (np.asarray(im.crop((l, t, l + 224, t + 224))) / 255 - mean) / std
    return a.transpose(2, 0, 1)[None].astype(np.float32)
out = {}
for line in sys.stdin:
    if not line.strip(): continue
    url, imgs = line.rstrip("\n").split("\t")
    ps = []
    for img in imgs.split("|"):
        try:
            raw = open(img, "rb").read() if os.path.exists(img) else urllib.request.urlopen(urllib.request.Request(img, headers={"User-Agent": "Mozilla/5.0"}), timeout=15).read()
            vo = vis.run(None, {vis.get_inputs()[0].name: prep(Image.open(io.BytesIO(raw)))})
            V = [o for o, m in zip(vo, vis.get_outputs()) if "embed" in m.name][0][0]; V = V / np.linalg.norm(V)
            p = np.exp(100 * T @ V); ps.append(p / p.sum())
        except Exception:
            pass  # image gone or unreadable
    if not ps:
        out[url] = None; continue
    p = np.mean(ps, axis=0); k = list(LABELS)
    out[url] = {"fit": round(float(sum(p[i] for i, x in enumerate(k) if x in FIT)), 2), "look": k[int(p.argmax())], "frames": len(ps)}
json.dump(out, sys.stdout)
