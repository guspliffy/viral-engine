# Paints a background plate (set-plate.js) on the CPU with a free, open model: SDXL base 1.0 (CreativeML Open
# RAIL++-M, commercial use allowed) + ByteDance SDXL-Lightning 4-step LoRA (OpenRAIL++). About 40 s per 768x1344
# picture on 4 cores, no graphics card, no fees. The first run downloads about 7 GB of weights.
#
#   pip install torch --index-url https://download.pytorch.org/whl/cpu ; pip install diffusers transformers accelerate safetensors peft
#   python engine/plates/paint.py "<prompt>" assets/plates/<name>.png [--size 768x1344] [--seed 11] [--no "sofa, table"]
#
# Prompt for an empty wall (the characters and the props they touch stay 3D in front of it): say "eye level view
# straight at the wall", the light ("golden hour sunlight through a window") and "3D animated movie background
# painting"; put furniture the 3D stage provides in --no. Paint a few seeds and pick one; the seed makes it repeatable.
import argparse, time, torch
from diffusers import StableDiffusionXLPipeline, EulerDiscreteScheduler

ap = argparse.ArgumentParser()
ap.add_argument("prompt"); ap.add_argument("out")
ap.add_argument("--size", default="768x1344"); ap.add_argument("--seed", type=int, default=1); ap.add_argument("--no", default="")
a = ap.parse_args()
W, H = map(int, a.size.split("x"))
neg = "people, person, character, text, watermark, logo, blurry, lowres, deformed" + (", " + a.no if a.no else "")
t = time.time()
pipe = StableDiffusionXLPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
pipe.load_lora_weights("ByteDance/SDXL-Lightning", weight_name="sdxl_lightning_4step_lora.safetensors"); pipe.fuse_lora()
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
img = pipe(a.prompt, negative_prompt=neg, num_inference_steps=4, guidance_scale=0, width=W, height=H, generator=torch.Generator().manual_seed(a.seed)).images[0]
img.save(a.out); print("wrote", a.out, round(time.time() - t), "s")
