# Heaven reads your search history thumbnail: raw.png (Codex) -> clean + four lettered options, 1080x1920, house lettering
# (small white line over a big yellow one, Inter Black; helpers from the part-thumbnails builder).
import os, sys
sys.path.insert(0, "/mnt/project-files/videos/ancient-aliens/part-thumbnails")
from PIL import Image
exec(open("/mnt/project-files/videos/ancient-aliens/part-thumbnails/build.py").read().split("only = sys.argv[1:]")[0])
HERE = os.path.dirname(os.path.abspath(__file__))
OPTS = {
  "1-heaven-reads":  [("HEAVEN READS", 104, WHITE), ("YOUR SEARCHES", 140, YELLOW)],
  "2-last-one":      [("NOT THE", 104, WHITE), ("LAST ONE", 190, YELLOW)],
  "3-hide-nothing":  [("ONE RULE:", 104, WHITE), ("HIDE NOTHING", 140, YELLOW)],
  "4-friend-heard":  [("HIS BEST FRIEND", 96, WHITE), ("HEARD IT ALL", 150, YELLOW)],
}
clean = to_916(Image.open(os.path.join(HERE, "raw.png")).convert("RGB"))
clean.save(os.path.join(HERE, "search-thumb-clean.jpg"), quality=93)
for name, lines in OPTS.items():
    img = clean.copy(); letter(img, 150, lines); img.save(os.path.join(HERE, f"search-thumb-{name}.jpg"), quality=93)
print("ok")
