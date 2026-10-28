#!/usr/bin/env python3
"""Audio test sheet: every sound as numbered cards (old code effect, Kenney library, AI takes), loudness-matched,
so Jonny can judge by ear and answer with numbers. Music beds play across their loop seam.

usage: sheet.py REPO OUT.mp4 [--work DIR]
Needs the repo's assets/sfx/ai and assets/music/ai (pick.py), node, ffmpeg, Pillow, pyloudnorm.
"""
import argparse, json, os, random, subprocess, tempfile
import numpy as np, soundfile as sf, librosa, pyloudnorm as pyln
from PIL import Image, ImageDraw, ImageFont

SR, W, H, FPS = 44100, 1080, 1920, 30
COL = {"OLD": (150, 150, 160), "KENNEY": (80, 160, 255), "AI": (255, 150, 40), "MUSIC": (190, 110, 255)}
SFX_LUFS, MUSIC_LUFS = -18.0, -16.0


def lib_take(path):
    """Like engine/sfx/library.mjs: mono, peak-normalised (the catalog gain is applied on top)."""
    y, _ = librosa.load(path, sr=SR, mono=True)
    return y / max(1e-9, np.abs(y).max())


def place(dur, hits):
    out = np.zeros(int(dur * SR))
    for x, at, g in hits:
        i = int(at * SR)
        n = min(len(x), len(out) - i)
        out[i:i + n] += x[:n] * g
    return np.stack([out, out], 1)


def match(x, target):
    meter = pyln.Meter(SR)
    pad = np.concatenate([x, np.zeros((max(0, int(0.5 * SR) - len(x)), 2))])
    l = meter.integrated_loudness(pad)
    g = 10 ** ((target - l) / 20) if np.isfinite(l) else 1
    pk = np.abs(x).max() * g
    if pk > 10 ** (-2 / 20):  # -2 dBFS sample peak keeps the AAC true peak under -1 dBTP
        g *= 10 ** (-2 / 20) / pk
    return x * g


def font(name, size, repo):
    return ImageFont.truetype(os.path.join(repo, "assets/fonts", name), size)


def card(repo, num, total, title, tag, detail, x, path, seam=None):
    im = Image.new("RGB", (W, H), (20, 22, 28))
    d = ImageDraw.Draw(im)
    d.text((80, 150), "SOUND TEST 01  ·  old vs library vs AI", font=font("Inter-ExtraBold.otf", 40, repo), fill=(140, 145, 160))
    d.text((80, 300), f"#{num}", font=font("Inter-Black.otf", 220, repo), fill=(255, 255, 255))
    size = 92
    while d.textlength(title, font=font("Inter-Black.otf", size, repo)) > W - 160:
        size -= 4
    d.text((80, 560 + (92 - size) // 2), title, font=font("Inter-Black.otf", size, repo), fill=(255, 255, 255))
    kind = tag.split()[0]
    tw = d.textlength(tag, font=font("Inter-Black.otf", 64, repo))
    d.rounded_rectangle((80, 700, 80 + tw + 60, 800), 24, fill=COL[kind])
    d.text((110, 712), tag, font=font("Inter-Black.otf", 64, repo), fill=(20, 22, 28))
    yy = 850
    for line in detail.split("\n"):
        d.text((80, yy), line, font=font("Inter-ExtraBold.otf", 40, repo), fill=(190, 195, 210)); yy += 56
    # waveform
    m = x.mean(1)
    top, bot, left, right = 1150, 1550, 80, W - 80
    mid = (top + bot) / 2
    cols = right - left
    env = np.array([np.abs(c).max() if len(c) else 0 for c in np.array_split(m, cols)])
    env = env / max(1e-9, env.max())
    for i, v in enumerate(env):
        d.line((left + i, mid - v * 190, left + i, mid + v * 190), fill=COL[kind])
    if seam is not None:  # where a music bed loops back to its start
        sx = left + int(cols * seam)
        d.line((sx, top - 30, sx, bot + 30), fill=(255, 255, 255), width=3)
        d.text((sx - 60, bot + 40), "loop seam", font=font("Inter-ExtraBold.otf", 32, repo), fill=(255, 255, 255))
    d.text((80, 1700), f"{num} / {total}   ·   reply with the numbers you like", font=font("Inter-ExtraBold.otf", 38, repo), fill=(140, 145, 160))
    im.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo"); ap.add_argument("out"); ap.add_argument("--work", default=tempfile.mkdtemp())
    a = ap.parse_args()
    repo, work = a.repo, a.work
    os.makedirs(work, exist_ok=True)
    sfx = {s["id"]: s for s in json.load(open(os.path.join(repo, "assets/sfx/ai/manifest.json")))["sounds"]}
    beds = json.load(open(os.path.join(repo, "assets/music/ai/manifest.json")))["sounds"]
    ai = lambda sid: [lib_take(os.path.join(repo, "assets/sfx/ai", f)) for f in sfx[sid]["files"]]
    rnd = random.Random(7)

    segs = []  # (title, tag, detail, dur, engine sfx list | None, ai hits | None)
    def eng(title, tag, detail, dur, s): segs.append((title, tag, detail, dur, s, None))
    def aiseg(title, tag, detail, dur, hits): segs.append((title, tag, detail, dur, None, hits))

    T = "Katana slice"
    eng(T, "OLD code", "the engine's synthesised \"shing\"", 1.8, [{"sound": "shing", "at": 0.25}])
    eng(T, "KENNEY", "library: whoosh + knife cut + ring", 1.8, [{"sound": "katana-slice", "at": 0.25}])
    for k, x in enumerate(ai("katana-slice")[:3], 1):
        aiseg(T, f"AI {k}", f"Stable Audio 3 Small\nai/katana-slice-0{k}", 1.8, [(x, 0.25, 0.35)])
    for surf in ["wood", "concrete", "grass", "carpet"]:
        T = f"Footsteps · {surf}"
        steps = [0.25 + 0.42 * k for k in range(6)]
        eng(T, "KENNEY", "library, 6 steps", 2.8, [{"sound": f"step-{surf}", "at": t} for t in steps])
        xs = ai(f"step-{surf}")
        aiseg(T, "AI", f"Stable Audio 3 Small\n6 steps from {len(xs)} takes", 2.8, [(xs[k % len(xs)], t, 0.3 * (0.85 + 0.15 * rnd.random())) for k, t in enumerate(steps)])
    T = "Typing"
    eng(T, "KENNEY", "library: clicks + switches, 11 keys/s", 3.0, [{"sound": "typing", "at": 0.25, "dur": 2.5}])
    keys, t, hits = ai("key-press"), 0.25, []
    while t < 2.75:
        hits.append((keys[rnd.randrange(len(keys))], t, 0.16 * (0.8 + 0.2 * rnd.random()))); t += (1 / 11) * (1 + 0.5 * (rnd.random() * 2 - 1))
    aiseg(T, "AI", f"Stable Audio 3 Small\n11 keys/s from {len(keys)} key presses", 3.0, hits)
    T = "Door knock"
    eng(T, "KENNEY", "library: 3 wood hits", 1.6, [{"sound": "knock", "at": 0.25}])
    kn = ai("knock")
    for v, idx in (("AI A", [0, 1, 2]), ("AI B", [3, 4, 5])):
        idx = [i % len(kn) for i in idx]
        aiseg(T, v, "Stable Audio 3 Small\n3 single knocks", 1.6, [(kn[i], 0.25 + o, g) for i, o, g in zip(idx, (0, 0.17, 0.33), (0.8, 0.75, 0.85))])
    T = "Magic zap"
    eng(T, "OLD code", "the engine's synthesised \"poof\"", 2.2, [{"sound": "poof", "at": 0.25}])
    eng(T, "KENNEY", "library: sci-fi zap", 2.2, [{"sound": "zap", "at": 0.25}])
    for k, x in enumerate(ai("magic-zap")[:3], 1):
        aiseg(T, f"AI {k}", f"Stable Audio 3 Small\nai/magic-zap-0{k}", 2.2, [(x, 0.25, 0.35)])
    T = "Wing flaps"
    flaps = [0.25 + 0.38 * k for k in range(5)]
    eng(T, "OLD code", "the engine's whoosh, 5 times", 2.4, [{"sound": "whoosh", "at": t} for t in flaps])
    wf = ai("wing-flap")
    for v, off in (("AI A", 0), ("AI B", 4)):
        aiseg(T, v, "Stable Audio 3 Small\n5 single flaps", 2.4, [(wf[(off + k) % len(wf)], t, 0.35) for k, t in enumerate(flaps)])

    # engine demos in one node call
    demos = [dict(name=f"seg{i:02d}", duration=s[3], sfx=s[4], seed=11 + i) for i, s in enumerate(segs) if s[4] is not None]
    json.dump(demos, open(os.path.join(work, "demos.json"), "w"))
    subprocess.run(["node", os.path.join(repo, "engine/soundgen/engine-sounds.mjs"), os.path.join(work, "demos.json"), work], check=True)

    items = []
    for i, (title, tag, detail, dur, es, hits) in enumerate(segs):
        if es is not None:
            x, _ = sf.read(os.path.join(work, f"seg{i:02d}.wav"))
        else:
            x = place(dur, hits)
        items.append((title, tag, detail, match(x, SFX_LUFS), None))
    for b in beds:
        for k, (f, row) in enumerate(zip(b["files"], b["takes"]), 1):
            y, _ = librosa.load(os.path.join(repo, "assets/music/ai", f), sr=SR, mono=False)
            y = y.T
            x = np.concatenate([y[-6 * SR:], y[:6 * SR]])
            items.append((f"Music · {b['id'].replace('-', ' ')}", f"MUSIC {k}", f"{b['bpm']} BPM, {b['bars']} bars ({row['durationSec']:.1f} s loop)\nplays across the loop seam at 6 s:\nyou should not hear the join", match(x, MUSIC_LUFS), 0.5))

    parts = []
    for i, (title, tag, detail, x, seam) in enumerate(items, 1):
        png, wav, mp4 = (os.path.join(work, f"c{i:02d}.{e}") for e in ("png", "wav", "mp4"))
        card(repo, i, len(items), title, tag, detail, x, png, seam)
        sf.write(wav, x, SR, subtype="PCM_16")
        dur = len(x) / SR
        play = f"[0][2]overlay=x='80+(W-160)*t/{dur:.3f}':y=1130:eval=frame"  # playhead
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-i", png, "-i", wav,
                        "-f", "lavfi", "-i", f"color=white:s=6x440:r={FPS}", "-filter_complex", play, "-t", f"{dur:.3f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast",
                        "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), mp4], check=True)
        parts.append(mp4)
    lst = os.path.join(work, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-preset", "veryfast", "-c:a", "aac", "-b:a", "192k", a.out], check=True)
    index = [dict(num=i, title=t, version=g, detail=d.replace("\n", " · ")) for i, (t, g, d, _, _) in enumerate(items, 1)]
    json.dump(index, open(os.path.splitext(a.out)[0] + ".index.json", "w"), indent=1)
    print(f"{a.out}: {len(items)} cards")


if __name__ == "__main__":
    main()
