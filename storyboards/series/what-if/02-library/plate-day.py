# One-off for What if EP02: paints the daylight library plate (assets/plates/library-hall-day.png), either fresh
# (engine/plates/paint.py's model: SDXL base + SDXL-Lightning 4-step, CPU, free) or img2img from a source plate so
# Too Much Energy 01's hall keeps its layout.
#   python storyboards/series/what-if/02-library/plate-day.py "<prompt>" <out.png> --seed 11 [--from <src.png> --strength 0.6] [--no "..."]
import argparse, time, torch
from diffusers import StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline, EulerDiscreteScheduler
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("prompt"); ap.add_argument("out")
ap.add_argument("--size", default="768x1344"); ap.add_argument("--seed", type=int, default=1); ap.add_argument("--no", default="")
ap.add_argument("--from", dest="src", default=None); ap.add_argument("--strength", type=float, default=0.6)
a = ap.parse_args()
W, H = map(int, a.size.split("x"))
neg = "people, person, character, text, watermark, logo, blurry, lowres, deformed" + (", " + a.no if a.no else "")
t = time.time()
P = StableDiffusionXLImg2ImgPipeline if a.src else StableDiffusionXLPipeline
pipe = P.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
pipe.load_lora_weights("ByteDance/SDXL-Lightning", weight_name="sdxl_lightning_4step_lora.safetensors"); pipe.fuse_lora()
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
g = torch.Generator().manual_seed(a.seed)
if a.src:
    src = Image.open(a.src).convert("RGB").resize((W, H), Image.LANCZOS)
    steps = max(4, round(4 / a.strength))   # Lightning wants ~4 denoising steps: strength x steps
    img = pipe(a.prompt, negative_prompt=neg, image=src, strength=a.strength, num_inference_steps=steps, guidance_scale=0, generator=g).images[0]
else:
    img = pipe(a.prompt, negative_prompt=neg, num_inference_steps=4, guidance_scale=0, width=W, height=H, generator=g).images[0]
img.save(a.out); print("wrote", a.out, round(time.time() - t), "s")
