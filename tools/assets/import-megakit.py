#!/usr/bin/env python3
"""Import Quaternius' Stylized Nature MegaKit (CC0, free Standard version) into assets/models/nature/.

  python3 -I tools/assets/import-megakit.py <unzipped kit>/glTF

Copies every model's .gltf + .bin (the huge twisted and dead trees are left out), drops the normal maps (the
toon look ignores them) and shrinks the textures to at most 1024 px (bark 512 px) with ffmpeg, so the whole kit
stays a few MB in the repo. Download: https://opengameart.org/content/stylized-nature-megakit (CC0 1.0).
"""
import json, os, shutil, subprocess, sys

SRC = sys.argv[1]
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "models", "nature")
SKIP = ("TwistedTree_", "DeadTree_", "Petal_")
# Bush_Common ships with the red autumn leaves (Leaves_TwistedTree_C); summer trail bushes get the green set
REMAP = {"Bush_Common.gltf": {"Leaves_TwistedTree_C.png": "Leaves_NormalTree_C.png"}}
os.makedirs(DST, exist_ok=True)
textures = set()
for f in sorted(os.listdir(SRC)):
    if not f.endswith(".gltf") or f.startswith(SKIP):
        continue
    d = json.load(open(os.path.join(SRC, f)))
    for m in d.get("materials", []):
        m.pop("normalTexture", None)
    for im in d.get("images", []):
        im["uri"] = REMAP.get(f, {}).get(im["uri"], im["uri"])
    used = {m["pbrMetallicRoughness"]["baseColorTexture"]["index"] for m in d.get("materials", []) if "baseColorTexture" in m.get("pbrMetallicRoughness", {})}
    for i in used:
        textures.add(d["images"][d["textures"][i]["source"]]["uri"])
    json.dump(d, open(os.path.join(DST, f), "w"), separators=(",", ":"))
    shutil.copy(os.path.join(SRC, f[:-5] + ".bin"), DST)
for t in sorted(textures):
    size = 512 if t.startswith("Bark") else 1024
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(SRC, t), "-vf",
                    f"scale='min({size},iw)':-1:flags=lanczos", os.path.join(DST, t)], check=True)
print(f"{len(textures)} textures, models in {os.path.normpath(DST)}")
