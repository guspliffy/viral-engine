#!/usr/bin/env python3
"""Render every recipe (prompt x seed) as a raw take through running sa3-server instances.

usage: generate.py RECIPES OUT_DIR [--sfx-url http://127.0.0.1:8006] [--music-url http://127.0.0.1:8007] [--only id,id]
Music takes run 6 s past their exact bar length. Writes OUT_DIR/<id>/p<prompt>-s<seed>.wav and OUT_DIR/timings.json. Takes that already exist are skipped.
"""
import argparse, base64, json, os, time, urllib.request


def call(url, path, body=None):
    req = urllib.request.Request(url + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def render(url, path, body, out):
    t0 = time.time()
    sid = call(url, path, body)["session_id"]
    while True:
        st = call(url, f"/poll_status/{sid}")
        if st.get("status") == "completed":
            break
        if st.get("status") in ("failed", "error", "cancelled"):
            raise RuntimeError(f"{out}: {st}")
        time.sleep(0.25)
    with open(out, "wb") as f:
        f.write(base64.b64decode(st["audio_data"]))
    return time.time() - t0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recipes"); ap.add_argument("out")
    ap.add_argument("--sfx-url", default="http://127.0.0.1:8006")
    ap.add_argument("--music-url", default="http://127.0.0.1:8007")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    rec = json.load(open(a.recipes))
    only = set(filter(None, a.only.split(",")))
    tpath = os.path.join(a.out, "timings.json")
    timings = json.load(open(tpath)) if os.path.exists(tpath) else {}
    jobs = []
    for r in rec["sfx"]:
        for pi, p in enumerate(r["prompts"]):
            for s in r["seeds"]:
                jobs.append((r["id"], pi, s, a.sfx_url, "/generate",
                             {"prompt": p, "duration": r["duration"], "steps": 8, "seed": s, "keep_models": True}, r["duration"]))
    for r in rec["music"]:
        loop_sec = r["bars"] * 4 * 60 / r["bpm"]
        for pi, p in enumerate(r["prompts"]):
            for s in r["seeds"]:
                # 6 s past the loop: room to start on the first beat and crossfade the tail into the head (seamless loop)
                jobs.append((r["id"], pi, s, a.music_url, "/generate",
                             {"prompt": p, "duration": round(loop_sec + 6, 3), "steps": 8, "seed": s, "keep_models": True}, loop_sec + 6))
    for sid, pi, seed, url, path, body, secs in jobs:
        if only and sid not in only:
            continue
        os.makedirs(os.path.join(a.out, sid), exist_ok=True)
        out = os.path.join(a.out, sid, f"p{pi}-s{seed}.wav")
        if os.path.exists(out):
            continue
        dt = render(url, path, body, out)
        timings[os.path.relpath(out, a.out)] = {"seconds": round(dt, 2), "audioSeconds": round(secs, 2)}
        print(f"{out}  {secs:.1f}s audio in {dt:.1f}s", flush=True)
        json.dump(timings, open(tpath, "w"), indent=1)


if __name__ == "__main__":
    main()
