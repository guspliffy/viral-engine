"""The listening half of the sound check, run by qa/sound.mjs with earshot's own Python
(github.com/Leonxlnx/earshot, MIT; CPU; CLAP + AudioSet models, ~1.1 GB, downloaded once by `earshot doctor --fetch`).

    <earshot python> qa/ears.py job.json out.json

job.json (written by qa/sound.mjs):
    { "mix": "clip.mp4", "fps": 30,
      "cues": [{ "t", "kind", "id" }],            hits the picture asks for: earshot's own sync to them, in the mix
      "floor": { "surface", "alts": [...], "steps": [{ t, file }] } }   each footstep on its own

out.json: { "sync": { stats, misses }, "floor": { n, top, share, worst } }. Models load once per run (~20-60 s).
"""
import json
import sys

from earshot import api

FLOOR_TEXT = {
    'wood': 'footsteps on a wooden floor', 'carpet': 'soft footsteps on carpet', 'concrete': 'footsteps on concrete',
    'grass': 'footsteps on grass', 'snow': 'footsteps crunching in snow', 'indoor': 'footsteps on a hard indoor floor',
}


def main(job_path, out_path):
    job = json.load(open(job_path, encoding='utf-8'))
    out = {}
    cues = job.get('cues') or []
    if cues:
        r = api.timeline(job['mix'], cues={'fps': job.get('fps', 30), 'events': cues}, detail='low')
        s = (r.get('sync') or {}).get('cues') or {}
        items = s.get('items') or []
        out['sync'] = {'stats': s.get('stats') or {}, 'misses': [
            {k: i.get(k) for k in ('t', 'id', 'offset_ms', 'status')} for i in items if i.get('status') != 'OK']}
    fl = job.get('floor')
    if fl and fl.get('steps'):
        want = FLOOR_TEXT[fl['surface']]
        alts = [FLOOR_TEXT[a] for a in fl['alts'] if a in FLOOR_TEXT and a != fl['surface']]
        rows = []
        for st in fl['steps']:
            m = api.match(st['file'], want, alts=alts)
            # forced choice between the floors: is the intended one the most likely?
            ranked = sorted([(m['query'], m['p_vs_alts'])] + [(a['query'], a['p']) for a in m.get('alts') or []], key=lambda x: -x[1])
            rows.append({'t': st['t'], 'p': round(m['p_vs_alts'], 3), 'top': ranked[0][0], 'z': round(m['z'], 2)})
        # a plain hard indoor floor may sound like wood or concrete
        ok = {want} | ({FLOOR_TEXT['wood'], FLOOR_TEXT['concrete']} if fl['surface'] == 'indoor' else set())
        top = sum(r['top'] in ok for r in rows)
        heard = {}
        for r in rows:
            heard[r['top']] = heard.get(r['top'], 0) + 1
        out['floor'] = {'n': len(rows), 'surface': fl['surface'], 'top': top, 'share': round(top / len(rows), 2),
                        'heard': heard, 'median_p': sorted(r['p'] for r in rows)[len(rows) // 2],
                        'worst': sorted(rows, key=lambda r: r['p'])[:3]}
    json.dump(out, open(out_path, 'w', encoding='utf-8'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
