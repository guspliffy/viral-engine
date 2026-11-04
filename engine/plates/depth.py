# Depth map for a background plate (set-plate.js "depth"): Depth Anything V2 Small (Apache-2.0), on the CPU in a few
# seconds. Writes a 16-bit greyscale PNG, white = near, black = far, the same size as the plate.
#
#   python engine/plates/depth.py assets/plates/<name>.png            -> assets/plates/<name>.depth.png
import sys, numpy as np, torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src.rsplit(".", 1)[0] + ".depth.png"
name = "depth-anything/Depth-Anything-V2-Small-hf"
proc, model = AutoImageProcessor.from_pretrained(name), AutoModelForDepthEstimation.from_pretrained(name).eval()
img = Image.open(src).convert("RGB")
with torch.no_grad():
    pred = model(**proc(images=img, return_tensors="pt")).predicted_depth   # relative inverse depth: big = near
d = torch.nn.functional.interpolate(pred[:, None], size=img.size[::-1], mode="bicubic", align_corners=False)[0, 0].numpy()
d = (d - d.min()) / max(1e-6, d.max() - d.min())
Image.fromarray((d * 65535).astype(np.uint16)).save(out)
print("wrote", out)

# Motion masks for the plate's ambient motion (set-plate.js "motion"), an RGB PNG next to it (engine/plates/masks.py):
#   red = foliage that sways: leaf-coloured AND textured like leaves (a flat green door or wall stays still), grown a
#   few pixels so a leaf can move over the wall behind it; green = sunlit wall and floor that shimmers as the leaves
#   outside move (bright, not the far sky in the window). Overrides in <name>.motion.json next to the plate:
#   {"still": [[x0, y0, x1, y1]], "sway": [...], "shimmer": [...]} (picture fractions, top left 0 0). Also writes
#   <name>.motion-review.png (sway red, shimmer yellow, still boxes cyan): look at it before using the plate.
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from masks import motion_masks, review, overrides_for
ov = overrides_for(src)
leaf, sun, _ = motion_masks(img, ov, depth=d)
mout = src.rsplit(".", 1)[0] + ".motion.png" if len(sys.argv) <= 2 else out.replace(".depth.", ".motion.")
Image.fromarray((np.stack([leaf, sun, np.zeros_like(sun)], -1) * 255).astype(np.uint8)).save(mout)
print("wrote", mout)
print("wrote", review(img, leaf, sun, ov.get("still"), mout.replace(".motion.png", ".motion-review.png"), os.path.basename(src)))
