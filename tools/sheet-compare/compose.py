#!/usr/bin/env python3
"""Sheet comparison video (thread "Bring the sheet faces and skin to the cast", 4 Nov 2026).

For each fighter: Jonny's design sheet on top (hero view + its face), then two looks side by side as a full figure and
as a face close-up, from the clips storyboards/characters/make-sheet-compare.mjs makes (rendered to out/). One 2.6 s
segment per fighter, joined into one vertical 1080x1920 MP4.

  python3 tools/sheet-compare/compose.py --looks art,sheet --labels "old,new" --out out/sheet-faces-compare.mp4
  python3 tools/sheet-compare/compose.py --looks sheet,sheet-hatch --labels "clean cel,hatching" --out out/x.mp4
  (--sheets: the folder of the design sheets, default /mnt/project-files/references/cast-sheets-v1)
"""
import argparse, json, os, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf")
ORDER = ["reaper", "phoenix", "wizard", "astronaut", "viking", "gunslinger", "dragon", "allfather", "samurai", "sorcerer"]
NAMES = {"allfather": "Norse god"}
# where the character sits in the two compare shots (1080x1920 frames)
BODY_CROP, FACE_CROP = (40, 240, 1000, 1280), (40, 680, 960, 1000)   # x, y, w, h


def esc(t):
    return t.replace(":", r"\:").replace("'", r"\'")


def segment(name, crops, sheets, looks, labels, out, tmp):
    c = crops[name]
    from PIL import Image
    im = Image.open(os.path.join(sheets, f"{c['sheet']}-reference-v1.png")).convert("RGB")
    paths = []
    for key, size in (("hero", (540, 560)), ("face", (540, 560))):
        p = im.crop(tuple(c[key])); k = min(size[0] / p.width, size[1] / p.height); p = p.resize((round(p.width * k), round(p.height * k)), Image.LANCZOS)
        bg = Image.new("RGB", size, (250, 245, 236)); bg.paste(p, ((size[0] - p.width) // 2, (size[1] - p.height) // 2))
        f = os.path.join(tmp, f"{name}-{key}.png"); bg.save(f); paths.append(f)
    vids = [os.path.join(ROOT, "out", f"sheetcmp-{name}-{l}-{s}-anime-pro.mp4") for l in looks for s in ("body", "face")]
    for v in vids:
        if not os.path.exists(v): raise SystemExit(f"missing {v}: render it first (node engine/render.mjs ... --silent)")
    bx, by, bw, bh = BODY_CROP; fx, fy, fw, fh = FACE_CROP
    title = NAMES.get(name, name.capitalize())
    lab = lambda t, x, y, s=34: f"drawtext=fontfile={FONT}:text='{esc(t)}':x={x}:y={y}:fontsize={s}:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=10"
    fc = [
        "[0:v]setsar=1[sh]", "[1:v]setsar=1[sf]",
        f"[2:v]crop={bw}:{bh}:{bx}:{by},scale=540:720,setsar=1[ab]", f"[3:v]crop={fw}:{fh}:{fx}:{fy},scale=540:560,setsar=1[af]",
        f"[4:v]crop={bw}:{bh}:{bx}:{by},scale=540:720,setsar=1[bb]", f"[5:v]crop={fw}:{fh}:{fx}:{fy},scale=540:560,setsar=1[bf]",
        "[sh][sf]hstack[top]", "[ab][bb]hstack[mid]", "[af][bf]hstack[bot]",
        "color=c=0x1c1714:s=1080x80:d=2.6[hd]",
        "[hd][top][mid][bot]vstack=inputs=4,fps=30,format=yuv420p[st]",
        f"[st]{lab(title, 24, 18, 44)},{lab('sheet', 24, 96)},{lab('sheet face', 564, 96)},"
        f"{lab(labels[0], 24, 656)},{lab(labels[1], 564, 656)},{lab(labels[0], 24, 1376)},{lab(labels[1], 564, 1376)}[v]",
    ]
    cmd = ["ffmpeg", "-y", "-v", "error", "-loop", "1", "-t", "2.6", "-i", paths[0], "-loop", "1", "-t", "2.6", "-i", paths[1]]
    for v in vids: cmd += ["-i", v]
    cmd += ["-filter_complex", ";".join(fc), "-map", "[v]", "-t", "2.6", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", out]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--looks", default="art,sheet"); ap.add_argument("--labels", default="old,new")
    ap.add_argument("--sheets", default="/mnt/project-files/references/cast-sheets-v1")
    ap.add_argument("--only", default=""); ap.add_argument("--out", default=os.path.join(ROOT, "out", "sheet-faces-compare.mp4"))
    a = ap.parse_args()
    crops = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "crops.json")))
    names = a.only.split(",") if a.only else ORDER
    with tempfile.TemporaryDirectory() as tmp:
        segs = []
        for n in names:
            s = os.path.join(tmp, f"{n}.mp4"); segment(n, crops, a.sheets, a.looks.split(","), a.labels.split(","), s, tmp); segs.append(s)
        lst = os.path.join(tmp, "list.txt")
        open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", a.out], check=True)
    print("wrote", a.out)


if __name__ == "__main__":
    main()
