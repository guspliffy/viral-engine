"""Pied Piper recut (Sol R1, 27 Nov): trimmed copies of the voice takes in out/legend-pp/vo-cut/ (wav + words.json), nothing re-recorded.
Long pauses are shortened inside the silences, dropped words are removed, 10 ms fades at every splice.
  python3 storyboards/series/legend/pied-piper/cut.py"""
import json, os, re, subprocess, sys
SRC, DST = "out/legend-pp/vo", "out/legend-pp/vo-cut"; os.makedirs(DST, exist_ok=True)
# per line: maxgap (longest silence kept inside the line), drop = (first word idx, last word idx) removed, head/tail = silence kept at the ends
CFG = json.load(open("storyboards/series/legend/pied-piper/cut.json"))
lines = json.load(open("storyboards/series/legend/pied-piper/lines.json"))["lines"]
def dur(p): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p],capture_output=True,text=True).stdout)
def silences(p, d):
    r = subprocess.run(["ffmpeg","-nostats","-i",p,"-af","silencedetect=n=-42dB:d=0.06","-f","null","-"],capture_output=True,text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    out = []
    for i, a in enumerate(st): out.append((max(0, a), en[i] if i < len(en) else d))
    return out
def quiet_after(p, t0, D):
    import numpy as np
    a = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",p,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout, np.float32)
    h = 320
    for i in range(int(t0 * 16000), len(a) - h, 160):
        if 20 * np.log10(np.sqrt((a[i:i + h] ** 2).mean()) + 1e-9) < -60: return i / 16000 + 0.02
    return None
for lid, who, *_ in lines:
    c = {**CFG["default"], **CFG.get(lid, {})}
    wav = f"{SRC}/{lid}.wav"; D = dur(wav); words = json.load(open(f"{SRC}/{lid}.words.json")); sil = silences(wav, D)
    if 'wshift' in c: words = [[w[0], w[1] + c['wshift'], w[2] + c['wshift']] for w in words]
    # snap Whisper's word times into the real voiced segments when the pause structure agrees (Whisper drifts up to 0.4 s)
    segs = []; q = 0.0
    for a, b in sil:
        if a - q > 0.05: segs.append((q, a))
        q = b
    if D - q > 0.05: segs.append((q, D))
    grp = [[words[0]]]
    for w in words[1:]:
        if w[1] - grp[-1][-1][2] >= 0.2: grp.append([w])
        else: grp[-1].append(w)
    if len(grp) == len(segs):
        snapped = []
        for g, (sa, sb) in zip(grp, segs):
            g0, g1 = g[0][1], g[-1][2]
            for w in g: snapped.append([w[0], sa + (w[1] - g0) * (sb - sa) / max(1e-3, g1 - g0), sa + (w[2] - g0) * (sb - sa) / max(1e-3, g1 - g0)])
        words = snapped
    else: print(lid, "word times kept as Whisper wrote them:", len(grp), "groups vs", len(segs), "segments")
    rem = []   # intervals removed
    voiced0 = sil[0][1] if sil and sil[0][0] <= 0.01 else 0.0
    rem.append((0, max(0, voiced0 - c["head"])))
    last = sil[-1] if sil else None
    if last and last[1] >= D - 0.02:   # end the take only where it has gone quiet (< -60 dB), never inside a soft tail or breath
        q = quiet_after(wav, last[0] + c["tail"], D)
        if q is not None and q < D - 0.02: rem.append((q, D))
    for a, b in sil:
        if a <= 0.01 or b >= D - 0.02: continue
        if b - a > c["maxgap"]: rem.append((a + c["maxgap"] / 2, b - c["maxgap"] / 2))
    if "drop" in c:
        i0, i1 = c["drop"]; ts, te = words[i0][1], words[i1][2]
        before = [s for s in sil if s[1] <= ts + 0.08 and (i0 == 0 or s[0] >= words[i0 - 1][2] - 0.08)]; after = [s for s in sil if s[0] >= te - 0.08 and s[1] <= words[i1 + 1][1] + 0.1]
        s2 = after[0] if after else (te, words[i1 + 1][1])
        if i0 == 0: rem.append((0, (c["cutto"] if "cutto" in c else s2[1]) - c["head"]))
        else:
            s1 = before[-1] if before else (words[i0 - 1][2], ts); rem.append(((s1[0] + s1[1]) / 2 - 0.0, (s2[0] + s2[1]) / 2))
    rem.sort(); mrg = []
    for a, b in rem:
        if b <= a: continue
        if mrg and a <= mrg[-1][1]: mrg[-1] = (mrg[-1][0], max(mrg[-1][1], b))
        else: mrg.append((a, b))
    keep = []; p = 0.0
    for a, b in mrg:
        if a > p: keep.append((p, a))
        p = b
    if p < D: keep.append((p, D))
    fl = []; 
    for k, (a, b) in enumerate(keep):
        fl.append(f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0,b-a-0.01):.4f}:d=0.01[s{k}]")
    fc = ";".join(fl) + ";" + "".join(f"[s{k}]" for k in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[o]"
    subprocess.run(["ffmpeg","-v","error","-y","-i",wav,"-filter_complex",fc,"-map","[o]","-ar","44100","-ac","1",f"{DST}/{lid}.wav"],check=True)
    def newt(t):
        off = 0.0
        for a, b in mrg:
            if t >= b: off += b - a
            elif t > a: off += t - a
        return t - off
    dropped = set(range(c["drop"][0], c["drop"][1] + 1)) if "drop" in c else set()
    nw = [[w[0], round(newt(w[1]), 3), round(newt(w[2]), 3)] for i, w in enumerate(words) if i not in dropped]
    json.dump(nw, open(f"{DST}/{lid}.words.json", "w"))
    print(lid, f"{D:.2f} -> {dur(f'{DST}/{lid}.wav'):.2f}")
