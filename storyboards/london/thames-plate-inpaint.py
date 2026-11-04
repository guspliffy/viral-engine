import sys, torch, os
from PIL import Image, ImageDraw, ImageFilter
from diffusers import StableDiffusionXLInpaintPipeline, EulerDiscreteScheduler
src, out = sys.argv[1], sys.argv[2]
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 5
im = Image.open(src).convert("RGB"); W, H = im.size
# mask: the railing and promenade: everything below a line just above the railing's top edge
m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
d.polygon([(0, 630), (W, 840), (W, H), (0, H)], fill=255)
m = m.filter(ImageFilter.GaussianBlur(10))
torch.set_num_threads(os.cpu_count() or 4)
pipe = StableDiffusionXLInpaintPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
pipe.load_lora_weights("ByteDance/SDXL-Lightning", weight_name="sdxl_lightning_8step_lora.safetensors"); pipe.fuse_lora()
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
r = pipe(prompt="anime film background painting, gouache, the wide calm river Thames at night, dark blue water with long golden reflections of the lit palace and clock tower, gentle ripples, no railing",
         negative_prompt="railing, fence, wall, people, boat, text, photo",
         image=im, mask_image=m, width=W, height=H, num_inference_steps=8, guidance_scale=0, strength=0.99,
         generator=torch.Generator().manual_seed(seed)).images[0]
r.save(out); print("wrote", out)
