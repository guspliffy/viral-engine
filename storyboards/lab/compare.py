#!/usr/bin/env python3
"""Quality lab: labelled side-by-side comparison video, full speed then half speed.

  python3 storyboards/lab/compare.py out.mp4 "Title" a.mp4="today|2.4 s/frame" b.mp4="cool backdrop|2.4 s/frame" ...
      [--audio first|none] [--crop x,y,w,h] [--cols n]

Each input is 1080x1920. Panels are laid out in a grid (2 -> 2x1, 3 -> 3x1, 4 -> 2x2, 5-6 -> 3x2), each labelled
(name on the first line, cost on the second). The whole grid plays at full speed, then again at half speed, with a
banner saying which. --crop takes the same region of every input (a face close-up) before laying them out.
"""
import subprocess, sys, os, tempfile

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def esc(s):
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def main():
    a = sys.argv[1:]
    out, title = a[0], a[1]
    audio, crop, cols = "first", None, None
    items = []
    i = 2
    while i < len(a):
        if a[i] == "--audio": audio = a[i + 1]; i += 2; continue
        if a[i] == "--crop": crop = [int(v) for v in a[i + 1].split(",")]; i += 2; continue
        if a[i] == "--cols": cols = int(a[i + 1]); i += 2; continue
        f, lab = a[i].split("=", 1)
        items.append((f, lab.split("|")))
        i += 1
    n = len(items)
    cols = cols or {1: 1, 2: 2, 3: 3, 4: 2}.get(n, 3)
    rows = (n + cols - 1) // cols
    sw, sh = (crop[2], crop[3]) if crop else (1080, 1920)
    pw = 1080 // cols if cols > 1 else 720
    ph = round(pw * sh / sw / 2) * 2
    lab_h = 92
    W, H = pw * cols, (ph + lab_h) * rows + 70
    W += W % 2
    parts = []
    for k, (f, lab) in enumerate(items):
        x, y = (k % cols) * pw, 70 + (k // cols) * (ph + lab_h)
        v = f"[{k}:v]" + (f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}," if crop else "") + f"scale={pw}:{ph}:flags=lanczos,setsar=1[p{k}]"
        parts.append(v)
    chain = [f"color=c=0x15131a:s={W}x{H}:r=30:d=3[bg0]"]
    last = "bg0"
    for k, (f, lab) in enumerate(items):
        x, y = (k % cols) * pw, 70 + (k // cols) * (ph + lab_h)
        chain.append(f"[{last}][p{k}]overlay={x}:{y + lab_h}:shortest=1[o{k}]")
        last = f"o{k}"
    texts = [f"drawtext=fontfile={FONT}:text='{esc(title)}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=18"]
    for k, (f, lab) in enumerate(items):
        x, y = (k % cols) * pw, 70 + (k // cols) * (ph + lab_h)
        fs = 30 if pw >= 500 else 24
        texts.append(f"drawtext=fontfile={FONT}:text='{esc(lab[0])}':fontcolor=0xffd36b:fontsize={fs}:x={x}+({pw}-text_w)/2:y={y + 12}")
        if len(lab) > 1:
            texts.append(f"drawtext=fontfile={FONT}:text='{esc(lab[1])}':fontcolor=0xcfcad8:fontsize={fs - 6}:x={x}+({pw}-text_w)/2:y={y + 50}")
    graph = ";".join(parts + chain) + f";[{last}]" + ",".join(texts) + ",split[g1][g2]"
    graph += f";[g1]drawtext=fontfile={FONT}:text='FULL SPEED':fontcolor=white:fontsize=24:x=w-text_w-14:y=H-30,setpts=PTS-STARTPTS[full]"
    graph += f";[g2]setpts=2*(PTS-STARTPTS),drawtext=fontfile={FONT}:text='HALF SPEED':fontcolor=0xff9f6b:fontsize=24:x=w-text_w-14:y=H-30[half]"
    graph += ";[full][half]concat=n=2:v=1:a=0[v]"
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for f, _ in items: cmd += ["-i", f]
    amap = []
    if audio == "first":
        # the first panel's sound at full speed, silence under the half-speed replay
        graph += f";[0:a]atrim=0:3,asetpts=PTS-STARTPTS[a0];anullsrc=r=44100:cl=stereo,atrim=0:6[sil];[a0][sil]concat=n=2:v=0:a=1[a]"
        amap = ["-map", "[a]", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-filter_complex", graph, "-map", "[v]", *amap, "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    print("wrote", out, f"{W}x{H}")


if __name__ == "__main__":
    main()
