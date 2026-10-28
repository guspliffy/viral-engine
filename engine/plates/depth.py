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

# Motion masks for the plate's ambient motion (set-plate.js "motion"), an RGB PNG next to it:
#   red = leaves that sway (green, saturated), grown a few pixels so a leaf can move over the wall behind it;
#   green = sunlit wall and floor that shimmers as the leaves outside move (bright, not the far sky in the window).
from PIL import ImageFilter
hsv = np.asarray(img.convert("HSV")).astype(float) / 255
h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
ramp = lambda x, a, b: np.clip((x - a) / (b - a), 0, 1)
leaf = np.clip(2 * (1 - abs(h - 85) / 40), 0, 1) * ramp(s, 0.2, 0.4) * ramp(v, 0.08, 0.18)
grow = lambda m, r: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))
                                .filter(ImageFilter.GaussianBlur(r))).astype(float) / 255
leaf = np.clip(grow(leaf, 5) * 1.5, 0, 1)
sun = grow(ramp(v, 0.8, 0.95) * ramp(d, 0.25, 0.4), 6)
mout = src.rsplit(".", 1)[0] + ".motion.png" if len(sys.argv) <= 2 else out.replace(".depth.", ".motion.")
Image.fromarray((np.stack([leaf, sun, np.zeros_like(sun)], -1) * 255).astype(np.uint8)).save(mout)
print("wrote", mout)
