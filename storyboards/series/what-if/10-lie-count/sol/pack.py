"""Builds the Sol check pack (Jonny's order: story check -> one Sol xhigh glitch/logic check -> full render):
BEATS.md (every shot and line on the film clock), one 2 fps sheet per segment, 12 fps strips of every walk and contact.
    python3 storyboards/series/what-if/10-lie-count/sol/pack.py <draft dir> <out dir>"""
import json, os, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(H)
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
S = json.load(open(f'{D}/SEGMENTS.json'))
md = ['# Lie count film, draft for the Sol check', '', 'Film clock in seconds. Each segment is one place; sheets are 2 frames/s, strips 12 frames/s.', '']
def ff(*a): subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a], check=True)
for g in S['segs']:
    sb = json.load(open(f"{D}/{g['id']}.json")); T0 = g['T0']
    vid = [f for f in os.listdir(src) if f.startswith(g['id']) and f.endswith('draft.mp4') and '.video.' not in f][0]
    n = int((g['T1'] - T0) * 2) + 1; cols = 8; rows = (n + cols - 1) // cols
    ff('-i', f'{src}/{vid}', '-vf', f'fps=2,scale=300:-1,drawtext=text=%{{pts\\:hms}}:x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile={cols}x{rows}', '-frames:v', '1', '-q:v', '4', f"{out}/{g['id']}-sheet.jpg")
    md += [f"## {g['id']} (film {T0:.2f}-{g['T1']:.2f} s): sheet {g['id']}-sheet.jpg", '']
    for b in sb['beats']:
        md.append(f"- {T0 + b['at']:.2f} shot \"{b['name']}\"")
        for d in b.get('do', []):
            t = T0 + b['at'] + d.get('at', 0)
            if d.get('macro') == 'narrate': md.append(f"  - {t:.2f} NARRATOR: {d['line']}")
            elif d.get('macro') == 'say': md.append(f"  - {t:.2f} {d['who'].upper()}: {d['line']}")
            elif d.get('do') == 'move' and d.get('dur', 0) > 0.4:
                a = b['at'] + d.get('at', 0); s0 = max(0, a - 0.3); dur = min(3.0, d['dur'] + 0.6)
                name = f"{g['id']}-walk-{d['who']}-{a:.1f}.jpg"
                ff('-ss', f'{s0:.2f}', '-t', f'{dur:.2f}', '-i', f'{src}/{vid}', '-vf', 'fps=12,scale=320:-1,tile=9x4', '-frames:v', '1', '-q:v', '5', f'{out}/{name}')
                md.append(f"  - {t:.2f} {d['who']} walks {d['dur']:.1f} s: strip {name}")
    md.append('')
open(f'{out}/BEATS.md', 'w').write('\n'.join(md) + '\n'); print(len(os.listdir(out)), 'files')
