#!/usr/bin/env python3
"""Glitches that live only in the picture (quality plan item 15 (a), 5 Nov 2026): dense optical flow on the final video.

The odd-frame check in qa/check.mjs compares grey blocks on a 36x64 copy; it sees a frame that differs from both
neighbours, but not where things moved or whether a part flipped and came back. This measures motion itself: OpenCV's
Farneback flow between every pair of frames at 270x480, averaged in 30x30 px cells (a 9x16 grid), and flags

  pop      a cell that moves a lot in one frame and moves back the next (a costume part, a hand or a mesh that flips
           for one frame): the two steps are large and point opposite ways while the frames around them are calm
  jump     a cell whose one-frame motion is several times the motion either side of it, without coming back (a pose
           that snaps, a prop that teleports, a frame-0 jump)
  flicker  a cell whose brightness changes and changes back in one frame with almost no motion (a light or a
           material that flashes, see-through parts that swap)

  against  a cell moving against all its neighbours for one frame while they move together (a part flipping the
           wrong way inside a moving body)
  strobe   a stretch where a large area moves over FAST px a frame: under the render's blur limit (144 px at 1080) it
           reads as a jump on a phone even when the move is smooth (IKEA's boards at 2.03 s)

Frames next to a cut, the frames of a hit-stop and the frames of a flash, shake or speed lines are skipped, and the
boxes of captions are masked (the caller passes them from the storyboard and layout: qa/pixels.mjs, as --skip in
seconds or a --plan JSON file {"skip": [[a, b]], "soft": [[a, b]], "masks": [{"from", "to", "box": [x, y, w, h]}]} in
1080x1920 pixels; "soft" windows, like particles and confetti, keep only findings over large areas). Every finding has
a level: "warn" (large or out-and-back: worth a look at the frame) or "note" (one cell, small: a fast hand, a particle).
Prints JSON: {"fps", "frames", "cuts", "findings": [...]}.

  python3 qa/flow.py <clip.mp4> [--plan plan.json] [--skip 1.23,4.5-4.8] [--from s] [--to s]

Needs opencv-python-headless and numpy (free; pip install opencv-python-headless).
"""
import json
import sys

import numpy as np

try:
    import cv2
except ImportError:  # the caller reports it as "not measured"
    print(json.dumps({"error": "opencv not installed (pip install opencv-python-headless)"}))
    sys.exit(0)

W, H, CELL = 270, 480, 30
GX, GY = W // CELL, H // CELL
# limits in px at 270 wide (a quarter of the 1080 frame): a pop moves over POP px and back; a jump is JUMP px and
# RATIO times the motion either side; a flicker changes a cell's mean brightness by FLICK levels and back, moving
# under CALM px
POP, JUMP, RATIO, FLICK, CALM = 2.5, 3.0, 4.0, 14.0, 0.6
# warn levels (else a note): a pop of POPW px (16 px at 1080) out and back; a jump of JUMPW px over JUMPC cells; a
# flicker over FLICKC cells; a strobe of FAST px (80 px at 1080) a frame over FASTC cells; any step out of frame 0
POPW, JUMPW, JUMPC, FLICKC, FAST, FASTC, FIRST = 4.0, 6.0, 3, 3, 20.0, 3, 3.0


def args():
    a = sys.argv[1:]
    o = {"clip": None, "skip": [], "soft": [], "masks": [], "from": 0.0, "to": None}
    i = 0
    while i < len(a):
        if a[i] == "--skip":
            for part in filter(None, a[i + 1].split(",")):
                p, _, q = part.partition("-")
                o["skip"].append((float(p), float(q) if q else float(p)))
            i += 2
        elif a[i] == "--plan":
            with open(a[i + 1]) as f:
                plan = json.load(f)
            o["skip"] += [tuple(x) for x in plan.get("skip", [])]
            o["soft"] += [tuple(x) for x in plan.get("soft", [])]
            o["masks"] += plan.get("masks", [])
            i += 2
        elif a[i] == "--from":
            o["from"] = float(a[i + 1]); i += 2
        elif a[i] == "--to":
            o["to"] = float(a[i + 1]); i += 2
        else:
            o["clip"] = a[i]; i += 1
    if not o["clip"]:
        print(__doc__); sys.exit(2)
    return o


def cells(a):
    """mean over each 30x30 cell: a (H, W) or (H, W, 2) array -> (GY, GX) or (GY, GX, 2)"""
    s = a[: GY * CELL, : GX * CELL]
    return s.reshape(GY, CELL, GX, CELL, *s.shape[2:]).mean(axis=(1, 3))


def grow(m):
    """the largest value in each cell's 3x3 neighbourhood"""
    return cv2.dilate(m.astype(np.float32), np.ones((3, 3), np.uint8))


def where(gy, gx):
    col = ["left", "left", "left", "middle", "middle", "middle", "right", "right", "right"][gx]
    row = "top" if gy < 5 else "centre" if gy < 11 else "bottom"
    return f"{col} {row}"


def main():
    o = args()
    cap = cv2.VideoCapture(o["clip"])
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    grey, lum = [], []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        g = cv2.cvtColor(cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        grey.append(g)
        lum.append(cells(g.astype(np.float32)))
    n = len(grey)
    if n < 4:
        print(json.dumps({"fps": fps, "frames": n, "findings": []})); return
    # flow[i]: from frame i-1 to frame i (cells, px); mag[i] its length
    flow = [np.zeros((GY, GX, 2), np.float32)]
    for i in range(1, n):
        fl = cv2.calcOpticalFlowFarneback(grey[i - 1], grey[i], None, 0.5, 3, 15, 3, 5, 1.2, 0)
        flow.append(cells(fl))
    flow = np.stack(flow)
    mag = np.linalg.norm(flow, axis=3)
    L = np.stack(lum)
    # a cut: most of the picture changes at once (the flow there means nothing)
    diff = np.array([0.0] + [float(np.abs(grey[i].astype(np.int16) - grey[i - 1]).mean()) for i in range(1, n)])
    cut = diff > 28
    skip = np.zeros(n, bool)
    for p, q in o["skip"]:
        skip[max(0, int(np.floor(p * fps)) - 1): min(n, int(np.ceil(q * fps)) + 2)] = True
    for i in np.nonzero(cut)[0]:
        skip[max(0, i - 1): min(n, i + 2)] = True
    soft = np.zeros(n, bool)
    for p, q in o["soft"]:
        soft[max(0, int(np.floor(p * fps)) - 1): min(n, int(np.ceil(q * fps)) + 2)] = True
    # masks: cells under a caption (in 1080x1920 px) from a frame before it shows to a frame after it goes
    mask = np.zeros((n, GY, GX), bool)
    sx, sy = W / 1080.0, H / 1920.0
    for m in o["masks"]:
        x, y, w, h = m["box"]
        x0, x1 = int(max(0, x * sx) // CELL), int(min(W - 1, (x + w) * sx) // CELL)
        y0, y1 = int(max(0, y * sy) // CELL), int(min(H - 1, (y + h) * sy) // CELL)
        a0, a1 = max(0, int(np.floor(m["from"] * fps)) - 2), min(n, int(np.ceil(m["to"] * fps)) + 3)
        mask[a0:a1, y0:y1 + 1, x0:x1 + 1] = True
    lo = int(o["from"] * fps); hi = n if o["to"] is None else min(n, int(o["to"] * fps) + 1)
    found = []
    for i in range(max(1, lo), min(n - 1, hi)):
        if skip[i] or skip[i + 1]:
            continue
        a, b = flow[i], flow[i + 1]
        ma, mb = mag[i], mag[i + 1]
        # the motion around the step: the frames before and after it
        before = mag[i - 1] if i > 1 else np.zeros_like(ma)
        after = mag[i + 2] if i + 2 < n else np.zeros_like(ma)
        calm = np.maximum(before, after)
        # a fast object leaves a cell in one step: its motion shows up in the next cells the frames either side, so
        # a jump is measured against the 3x3 neighbourhood's motion before and after (a snapped pose has none)
        near = np.maximum(grow(before), grow(after)) if i > 1 else grow(after)
        # pop: out and back (the two steps cancel), large, with calm frames around
        back = np.linalg.norm(a + b, axis=2)
        pop = (ma > POP) & (mb > POP) & (back < 0.35 * np.minimum(ma, mb)) & (calm < 0.35 * np.minimum(ma, mb))
        # jump: one step several times the steps either side (frame 0 -> 1 has no step before it: the steps after count)
        ref = np.maximum(near, grow(mb))
        jump = (ma > JUMP) & (ma > RATIO * np.maximum(ref, 0.25)) & ~pop
        # flicker: brightness out and back with almost no motion
        dl, dn = L[i] - L[i - 1], L[i + 1] - L[i]
        flick = (np.abs(dl) > FLICK) & (np.abs(dn) > FLICK) & (np.sign(dl) != np.sign(dn)) & (np.maximum(ma, mb) < CALM) & (np.abs(L[i + 1] - L[i - 1]) < 0.3 * np.abs(dl))
        # against: the 8 neighbours move together (each over 2 px, within 45 degrees of their mean), the cell goes the
        # other way (over POP px, against their mean), and only for this one frame
        nb = cv2.blur(a, (3, 3), borderType=cv2.BORDER_REPLICATE) * 9 - a  # the neighbours' sum
        nbm = np.linalg.norm(nb, axis=2) / 8
        cosv = (a * nb).sum(axis=2) / (np.maximum(ma, 1e-6) * np.maximum(np.linalg.norm(nb, axis=2), 1e-6))
        lowest = -cv2.dilate(-mag[i], np.ones((3, 3), np.uint8))  # the slowest cell around (the cell itself counts too)
        against = (ma > POP) & (nbm > 2.0) & (cosv < -0.5) & (lowest > 1.0) & (calm < 0.5 * ma) & ~pop
        # strobe: the first frame of a stretch where a large area moves over FAST px a frame
        fast = (ma > FAST) & ~mask[i]
        strobe = fast if fast.sum() >= FASTC and (mag[i - 1][~mask[i - 1]] > FAST).sum() < FASTC else np.zeros_like(fast)
        free = ~(mask[i] | mask[i - 1] | mask[min(n - 1, i + 1)])
        for kind, m, score in (("pop", pop, np.minimum(ma, mb)), ("jump", jump, ma), ("flicker", flick, np.abs(dl)), ("against", against, ma), ("strobe", strobe, ma)):
            m = m & free
            if not m.any():
                continue
            k = np.argmax(np.where(m, score, -1))
            gy, gx = divmod(int(k), GX)
            sc, nc = float(score[gy, gx]), int(m.sum())
            if i == 1 and kind == "jump":
                kind, warn = "frame0-jump", sc >= FIRST
            elif kind == "pop":
                warn = sc >= POPW or nc >= 2
            elif kind == "jump":
                warn = sc >= JUMPW and nc >= JUMPC
            elif kind == "against":
                warn = sc >= POPW
            elif kind == "flicker":
                warn = nc >= FLICKC
            else:
                warn = False  # a strobe is a smooth move: a note to look at, never a defect on its own
            # particles, confetti and sparks: only a large area counts
            if soft[i] and nc < JUMPC:
                warn = False
            found.append({"t": round(i / fps, 3), "frame": i, "kind": kind, "level": "warn" if warn else "note",
                          "score": round(sc, 2), "cells": nc, "where": where(gy, gx), "px": [gx * CELL * 4, gy * CELL * 4]})
    print(json.dumps({"fps": fps, "frames": n, "cuts": [round(i / fps, 3) for i in np.nonzero(cut)[0]], "findings": found}))


if __name__ == "__main__":
    main()
