"""Builds the two thumbnail storyboards (A/B test, Jonny 19 Nov) from the film's own segments: one still each,
cast placed for the picture, no tags or captions (the big number tags are drawn on in letter.py).
    python3 storyboards/series/what-if/10-lie-count/thumbs/make-thumbs.py
    node engine/render.mjs <thumb.json> --stills 0.5 --out out/lc10-thumbs"""
import json, os
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(H)
def build(src, name, cast, shot, props=None, set_extra=None):
    sb = json.load(open(f'{D}/{src}.json'))
    keep = {c['id'] for c in sb['cast']}
    do = []
    for c in sb['cast']:
        if c['id'] in cast:
            at, face, expr, extra = cast[c['id']]
            c.update(at=at, face=face, expr=expr)
            do += [{"who": c['id'], "do": "show", "at": 0}, {"who": c['id'], "do": "expr", "expr": expr, "set": extra, "dur": 0.01, "at": 0}]
        else:
            c.update(at=[60 + len(do), 60])
    if set_extra: sb['set'].update(set_extra)
    if props is not None: sb['props'] = [p for p in sb['props'] if p['id'] in props]
    sb['score'] = {"view": [], "tags": []}; sb['captions'] = []
    sb['beats'] = [{"name": name, "at": 0, "len": 1.0, "shot": shot, "do": do}]
    sb['id'] = name; sb['music'] = None if 'music' in sb else sb.get('music')
    sb['tool'] = 'thumbnail reference still for Codex (one frame), never a video'   # CI episodes skip a tool storyboard
    json.dump(sb, open(f'{H}/{name}.json', 'w'), indent=1)
# A: the best friend smiling over the bun, Spud in the foreground, side-eye
build('lc10-01-terrace', 'lc10-thumb-a', {
    'spud': ([-1.953, 0.789], 38, 'focused', {"brow": 0.6}),
    'mash': ([-1.047, 1.211], -45, 'happy', {"curve": 0.8})},
    {"pos": [-2.75, 0.9, 3.0], "look": [-1.4, 1.02, 1.0], "fov": 36})
# B: the best friend (215) and the "trust me" friend (0) side by side at sunset, Spud between them, eyes to one side
build('lc10-21-hill', 'lc10-thumb-b', {
    'spud': ([0.2, -2.0], 0, 'focused', {"brow": 0.5}),
    'mash': ([-0.75, -2.3], 14, 'happy', {"curve": 0.8}),
    'wedge': ([1.15, -2.3], -14, 'deadpan', {})},
    {"pos": [0.2, 0.72, 0.55], "look": [0.2, 1.08, -2.3], "fov": 40}, set_extra={"leaves": 0})
print('ok')
