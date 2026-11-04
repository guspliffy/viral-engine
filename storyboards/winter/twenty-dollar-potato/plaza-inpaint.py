# The $20 Potato's painted set (assets/environments/bryant-park-winter-village): seed 21 painted the skating rink right
# up to the painting camera, so the queue would stand on the ice. This repaints the bottom of the picture as the
# snowy stone plaza in front of the rink (the market's floor), keeping the rink, the tree and the towers behind it.
#   python storyboards/winter/twenty-dollar-potato/plaza-inpaint.py <paint.png> <out.png> [seed]
import sys, torch, os
from PIL import Image, ImageDraw, ImageFilter
from diffusers import StableDiffusionXLInpaintPipeline, EulerDiscreteScheduler
src, out = sys.argv[1], sys.argv[2]
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 5
im = Image.open(src).convert("RGB"); W, H = im.size
# the mask: everything below the rink's near edge (rows ~0.79 of the height down), a soft edge so the boards blend
m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
d.polygon([(0, int(H * 0.775)), (W, int(H * 0.775)), (W, H), (0, H)], fill=255)
m = m.filter(ImageFilter.GaussianBlur(8))
torch.set_num_threads(os.cpu_count() or 4)
pipe = StableDiffusionXLInpaintPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
pipe.load_lora_weights("ByteDance/SDXL-Lightning", weight_name="sdxl_lightning_8step_lora.safetensors"); pipe.fuse_lora()
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
r = pipe(prompt="anime film background painting, gouache, a low wooden rink barrier with snow on top, in front of it a wide empty plaza of grey stone paving with a thin layer of trampled snow, warm lamplight on the snow, dusk",
         negative_prompt="ice, water, reflection, people, person, text, photo, fence posts in foreground",
         image=im, mask_image=m, width=W, height=H, num_inference_steps=8, guidance_scale=0, strength=0.99,
         generator=torch.Generator().manual_seed(seed)).images[0]
r.save(out); print("wrote", out)
