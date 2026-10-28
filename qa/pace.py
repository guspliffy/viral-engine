#!/usr/bin/env python3
"""Pacing meter: cuts, motion and loudness per second of any MP4, ours against a reference.

    python qa/pace.py out/x.mp4                                  -> per-second table of one clip
    python qa/pace.py out/x.mp4 --ref reference.mp4 [--ref ...]  -> both tables, then a side-by-side summary
    python qa/pace.py out/x.mp4 --ref ref.mp4 --png pace.png     -> plus a chart: one row per clip, a bar a second
    python qa/pace.py out/x.mp4 --json                           -> the numbers as JSON (experiments, results.mjs)

A reference is any vertical clip that holds viewers (a top post, one of ours that did well). It answers "is ours
slower, quieter or busier than what works", second by second, not whether the joke lands.

Per second: hard cuts, motion (mean |dY| between frames on a 270x270 grey copy, 0..255), held (share of frames that
barely change), loudness (dBFS over 100 ms windows: median and 90th percentile), onsets (sudden rises in energy) and
brightness (spectral centroid, Hz). Hard cuts: a frame that changes more than max(8, 4x the median of the +-12 frames
around it), outside runs that step on 2s (a pose held two frames) or flicker A/B.

Ported from cth9191/animate, plugins/animate/skills/animate/tools/measure/shotlog.py (MIT, Copyright (c) 2026
cth9191): the frame and audio measures, the cut, stepped and flicker rules and the per-second table are theirs; the
reference comparison, the summary, the chart and the JSON are ours, and the stepped test uses medians (see measure).
"""
import json
import subprocess
import sys

import numpy as np

S = 270


def frames(v):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-vf', f'scale={S}:{S}:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, S, S).astype(np.int16)


def audio(v, sr=16000):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768, sr


def video_fps(v):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout.strip()
    a, b = (r.split('/') + ['1'])[:2]
    return max(1, round(float(a) / float(b or 1))) if a else 30   # frame indexing needs a whole fps (29.97 -> 30)


def runs(mask, minlen):
    out, start = [], None
    for i, m in enumerate(list(mask) + [False]):
        if m and start is None:
            start = i
        if not m and start is not None:
            if i - start >= minlen:
                out.append((start, i - 1))
            start = None
    return out


def measure(v, fps=None):
    fps = fps or video_fps(v)
    F = frames(v)
    n = len(F)
    d = np.zeros(n)
    d2 = np.zeros(n)
    for f in range(1, n):
        d[f] = np.abs(F[f] - F[f - 1]).mean()
    for f in range(4, n):
        d2[f] = np.abs(F[f] - F[f - 4]).mean()
    med = np.array([np.median(d[max(1, f - 12):f + 13]) for f in range(n)])
    cuts = [f for f in range(1, n) if d[f] > max(8, 4 * med[f]) and d[f] >= d[max(0, f - 1)] and d[f] >= d[min(n - 1, f + 1)]]
    # stepped on 2s: in a 12-frame window, one parity carries the motion (medians, so one cut in the window doesn't
    # make its parity look stepped: with means every cut in a calm clip read as stepping and was dropped)
    step = np.zeros(n, bool)
    for f in range(12, n):
        w = d[f - 11:f + 1]
        a, b = np.median(w[0::2]), np.median(w[1::2])
        hi, lo = max(a, b), min(a, b)
        if hi > 6.0 and lo < hi / 4:
            step[f - 11:f + 1] = True
    flick = np.zeros(n, bool)
    for f in range(4, n):
        if d[f] > 8 and d2[f] < 0.35 * d[f]:
            flick[f] = True
    real = [c for c in cuts if not step[c] and not flick[c]]
    # audio per 100 ms
    x, sr = audio(v)
    win = sr // 10
    nw = len(x) // win
    rms = np.array([np.sqrt((x[i * win:(i + 1) * win] ** 2).mean() + 1e-12) for i in range(nw)])
    db = 20 * np.log10(rms + 1e-9)
    flux = np.maximum(0, np.diff(rms, prepend=rms[0])) if nw else np.zeros(0)
    onset = (flux > 2.5 * (np.median(flux) + 1e-6)) & (flux > 0.01) if nw else np.zeros(0, bool)
    secs = int(np.ceil(n / fps))
    rows = []
    for s in range(secs):
        f0, f1 = s * fps, min(n, (s + 1) * fps)
        w0, w1 = s * 10, min(nw, (s + 1) * 10)
        seg = x[s * sr:(s + 1) * sr]
        cen = 0.0
        if len(seg) > 256:
            spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
            fr = np.fft.rfftfreq(len(seg), 1 / sr)
            cen = float((spec * fr).sum() / (spec.sum() + 1e-9))
        row = {'sec': s, 'cuts': sum(1 for k in real if f0 <= k < f1), 'motion': float(d[max(1, f0):f1].mean()) if f1 > max(1, f0) else 0.0,
               'held': float((d[max(1, f0):f1] < 0.8).mean() * 100) if f1 > max(1, f0) else 100.0}
        if w1 > w0:
            row.update(db_med=float(np.median(db[w0:w1])), db_p90=float(np.percentile(db[w0:w1], 90)), onsets=int(onset[w0:w1].sum()), bright=cen)
        rows.append(row)
    full = min(secs, nw // 10)
    return {
        'file': v, 'fps': fps, 'frames': n, 'duration': n / fps, 'cuts': [c / fps for c in real], 'all_cuts': len(cuts),
        'stepped': [(a / fps, (b + 1) / fps) for a, b in runs(step, 12)], 'flicker': [(a / fps, (b + 1) / fps) for a, b in runs(flick, 4)],
        'rows': rows, 'motion': float(d[1:].mean()) if n > 1 else 0.0, 'motion_2s': float(d[1:2 * fps].mean()) if n > 2 else 0.0,
        'held': float((d[1:] < 0.8).mean() * 100) if n > 1 else 100.0,
        'db_med': float(np.median(db)) if nw else None, 'db_range': float(np.percentile(db, 90) - np.percentile(db, 10)) if nw else None,
        'onsets_per_s': float(onset.sum() / max(1e-9, nw / 10)) if nw else None,
        'loudest': (float(db.max()), float(db.argmax() / 10)) if nw else None,
        'quietest_sec': min(((float(np.median(db[s * 10:(s + 1) * 10])), s) for s in range(max(1, full - 1))), default=None) if nw >= 10 else None,
    }


def print_table(m):
    fps = m['fps']
    print(f"\n=== {m['file']}: {m['frames']} frames @ {fps}fps ({m['duration']:.2f}s), {len(m['cuts'])} hard cuts")
    print('hard cuts outside stepped/flicker runs: ' + (', '.join(f'{c:.2f}s' for c in m['cuts']) or 'none'))
    print('stepped on 2s: ' + (', '.join(f'{a:.2f}-{b:.2f}s' for a, b in m['stepped']) or 'none'))
    print('flicker A/B: ' + (', '.join(f'{a:.2f}-{b:.2f}s' for a, b in m['flicker']) or 'none'))
    print(' sec  cuts  motion  held%   dB med  dB p90  onsets  bright Hz')
    for r in m['rows']:
        base = f"{r['sec']:4d}  {r['cuts']:4d}  {r['motion']:6.1f}  {r['held']:5.0f}"
        print(base + (f"  {r['db_med']:7.1f}  {r['db_p90']:6.1f}  {r['onsets']:6d}  {r['bright']:8.0f}" if 'db_med' in r else '  (no audio)'))
    if m['loudest']:
        q = m['quietest_sec']
        print(f"loudest 100ms: {m['loudest'][0]:.1f} dB at {m['loudest'][1]:.1f}s" + (f"; quietest second (median): {q[0]:.1f} dB at {q[1]}s" if q else ''))


def summary(ms):
    """one line per measure, one column per clip: the first is ours, the rest references"""
    def avg_shot(m):
        edges = [0.0] + m['cuts'] + [m['duration']]
        return m['duration'] / max(1, len(edges) - 1)
    lines = [
        ('length', lambda m: f"{m['duration']:.1f} s"),
        ('hard cuts', lambda m: f"{len(m['cuts'])} ({len(m['cuts']) / m['duration']:.2f}/s)"),
        ('average shot', lambda m: f"{avg_shot(m):.1f} s"),
        ('first cut', lambda m: f"{m['cuts'][0]:.2f} s" if m['cuts'] else 'none'),
        ('longest shot', lambda m: (lambda e: f"{max(b - a for a, b in zip(e, e[1:])):.1f} s")([0.0] + m['cuts'] + [m['duration']])),
        ('motion (mean)', lambda m: f"{m['motion']:.1f}"),
        ('motion 0-2 s', lambda m: f"{m['motion_2s']:.1f}"),
        ('held frames', lambda m: f"{m['held']:.0f}%"),
        ('loudness median', lambda m: f"{m['db_med']:.1f} dB" if m['db_med'] is not None else '-'),
        ('loudness range', lambda m: f"{m['db_range']:.1f} dB" if m['db_range'] is not None else '-'),
        ('onsets', lambda m: f"{m['onsets_per_s']:.1f}/s" if m['onsets_per_s'] is not None else '-'),
        ('loudest 100 ms', lambda m: f"{m['loudest'][1]:.1f} s ({m['loudest'][0]:.0f} dB)" if m['loudest'] else '-'),
    ]
    names = ['ours'] + [f'ref {i}' if len(ms) > 2 else 'reference' for i in range(1, len(ms))]
    w = max(16, *(len(n) for n in names))
    print('\n=== pace summary (motion: mean |dY| per frame 0..255; loudness range: 90th minus 10th percentile of 100 ms windows)')
    for i, m in enumerate(ms):
        print(f"  {names[i]}: {m['file']}")
    print(f"  {'':16s}" + ''.join(f'{n:>{w}s}' for n in names))
    for label, f in lines:
        print(f'  {label:16s}' + ''.join(f'{f(m):>{w}s}' for m in ms))


def chart(ms, out):
    """one row per clip: a bar a second for motion (grey), red ticks at cuts, loudness median as a line (blue)"""
    from PIL import Image, ImageDraw, ImageFont
    px, H, pad, top = 60, 220, 40, 34
    secs = max(len(m['rows']) for m in ms)
    W = pad * 2 + secs * px
    img = Image.new('RGB', (W, len(ms) * (H + top) + 70), 'white')
    g = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('assets/fonts/Inter-ExtraBold.otf', 20)
    except OSError:
        font = ImageFont.load_default()
    mmax = max(max((r['motion'] for r in m['rows']), default=1) for m in ms) or 1
    for i, m in enumerate(ms):
        y0 = i * (H + top) + top
        g.text((pad, y0 - 28), f"{'ours' if i == 0 else 'reference'}: {m['file'].split('/')[-1]}  ({m['duration']:.1f}s, {len(m['cuts'])} cuts)", fill='black', font=font)
        g.rectangle([pad, y0, pad + secs * px, y0 + H], outline='#999')
        pts = []
        for r in m['rows']:
            x = pad + r['sec'] * px
            h = H * r['motion'] / mmax
            g.rectangle([x + 8, y0 + H - h, x + px - 8, y0 + H], fill='#bbb')
            if 'db_med' in r:
                pts.append((x + px / 2, y0 + H * min(1, max(0, -r['db_med'] / 50))))
        if len(pts) > 1:
            g.line(pts, fill='#2563eb', width=4)
        for c in m['cuts']:
            x = pad + c * px
            g.line([x, y0, x, y0 + H], fill='#dc2626', width=3)
    yb = len(ms) * (H + top) + 10
    for s in range(secs + 1):
        g.text((pad + s * px - 6, yb), str(s), fill='black', font=font)
    g.text((pad, yb + 26), 'grey: motion   red: cut   blue: loudness (up = louder)', fill='#444', font=font)
    img.save(out)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]

    def opt(k):
        if k not in args:
            return None
        i = args.index(k)
        v = args[i + 1]
        del args[i:i + 2]
        return v
    refs = []
    while '--ref' in args:
        refs.append(opt('--ref'))
    fps = opt('--fps')
    png = opt('--png')
    js = '--json' in args
    if js:
        args.remove('--json')
    if not args:
        print('usage: python qa/pace.py <clip.mp4> [--ref reference.mp4 ...] [--png chart.png] [--json] [--fps N]', file=sys.stderr)
        sys.exit(2)
    ms = [measure(v, int(fps) if fps else None) for v in args[:1] + refs + args[1:]]
    if js:
        print(json.dumps(ms, indent=1))
    else:
        for m in ms:
            print_table(m)
        if len(ms) > 1:
            summary(ms)
    if png:
        print(f'wrote {chart(ms, png)}')
