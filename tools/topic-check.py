#!/usr/bin/env python3
"""Topic check for a new video idea (on trial, 19 Nov 2026). Rule and evidence: docs/research/topic-check/README.md.

    python3 tools/topic-check.py "What if gravity got 1 g stronger every 5 seconds?"

Prints the hop/flop patterns the idea's title line matches and the closest real videos from
docs/research/topic-check/titles.csv.gz (views / that channel's median). It warns; it does not score or decide.
"""
import csv, gzip, math, re, statistics, sys
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "docs/research/topic-check/titles.csv.gz"

# (name, regex, kind, evidence). "measured" = within-channel effect over 9,835 uploads of 377 English channel
# tabs (19 Nov); "read" = pattern read from a few dozen named videos, not measured.
PATTERNS = [
    ("survive", r"surviv", "hop", "measured x2.1 within a channel (22 channels used it both ways)"),
    ("what if", r"what if|imagine if", "hop", "measured x1.7 within a channel"),
    ("N days / hours / years", r"\b\d+\s*(days?|hours?|years?)\b", "hop", "measured x1.5"),
    ("number people compare themselves on", r"\b(iq|height|age|aging|aged|salary|crush|how many|everyone'?s)\b",
     "hop", "read: see everyone's IQ 8.7x, future height 4.4x, crush count 2.3x"),
    ("something every viewer has (age, birth, body, family, time)",
     r"\b(age|aging|aged|born|baby|birth|die|death|sleep|parents?|mom|dad|body|heart|brain|memory|memories)\b",
     "hop", "read: aged backwards 144x, last baby ever born 23x, stopped aging at 18 20x"),
    ("fixed step rule (every N s, doubles, halves)", r"every \d+|each (second|step|day)|doubl|half|halves|\+\d",
     "hop", "read: 13 of 13 saved 3D step-rule what-ifs beat their account average 1.7-13.7x"),
    ("ranking", r"\btop \d+|\d+ (tallest|biggest|largest|most|deadliest|fastest|worst|best)", "hop",
     "read: 10 tallest giants, then the scale breaks 230x (works with a break at the end)"),
    ("history topic words", r"\b(war|ancient|history|historic|empire|century|medieval|pharaohs?|egypt|pyramids?|kingdoms?|wars|empires)\b",
     "flop", "measured x0.8; documentary series cut 19 Nov (best held 13 % to the end)"),
    ("one person's true story (He did X. Then Y.)", r"^(he|she|this (man|woman|guy|girl|boy|kid))\b|\bman who\b|\bwoman who\b",
     "flop", "read: 0.3-0.8x on every fact channel tried; generic rescue story 0.05x"),
    ("two-part premise (X... and Y)", r"\.\.\.|…|\band (a|then|couldn'?t|can'?t)\b", "flop",
     "read: smell everything... and couldn't turn it off 0.5x; 10x bigger... and a flood hit 1.0x"),
    ("moral or abstract premise", r"\b(antichrist|sin|soul|regret|mistake|meaning|karma|evil|good deeds?)\b",
     "flop", "read: antichrist 0.1x, biggest mistake 0.2x"),
    ("series label (Part n, Ep n)", r"\b(part|ep\.?|episode)\s*\d", "flop",
     "read: Ep. 5 0.3x, most Part 1 titles 0.3-0.5x; measured x0.96"),
    ("person-type label (the friend who...)", r"\bthe (friend|guy|girl|person|one) (who|that)\b", "flop",
     "read: the friend that's brutally honest 0.3x"),
]

STOP = set("a an the of to in on at for and or but if is are was were be been you your you're yourself i we he she "
           "it they them this that what who how why when where with from by as into than then so just can could "
           "would will do does did not no yes all every each one my our his her their its out up down".split())


def words(t):
    return [w for w in re.findall(r"[a-z0-9']+", t.lower()) if w not in STOP and len(w) > 2]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    idea = " ".join(sys.argv[1:])
    print(f"TOPIC CHECK (on trial, warns only): {idea}\n")
    hits = [(n, k, e) for n, rx, k, e in PATTERNS if re.search(rx, idea, re.I)]
    for kind in ("hop", "flop"):
        rows = [h for h in hits if h[1] == kind]
        print(f"{kind.upper()} patterns: {len(rows)}")
        for n, _, e in rows:
            print(f"  - {n}: {e}")
    if not hits:
        print("  (no known pattern: judge by the closest videos below)")

    with gzip.open(DATA, "rt", newline="") as f:
        rows = list(csv.DictReader(f))
    df = Counter()
    toks = []
    for r in rows:
        ws = set(words(r["title"]))
        toks.append(ws)
        df.update(ws)
    n = len(rows)
    q = set(words(idea))
    scored = []
    for r, ws in zip(rows, toks):
        shared = q & ws
        if not shared:
            continue
        s = sum(math.log(n / df[w]) for w in shared) / math.sqrt(len(ws) + 3)
        scored.append((s, r))
    scored.sort(key=lambda x: -x[0])
    top = scored[:15]
    print(f"\nCLOSEST REAL VIDEOS (views / that channel's median; 1.0 = usual, from {n:,} titles)")
    for s, r in top[:8]:
        print(f"  {float(r['multiple']):7.2f}x  {r['title'][:80]}  [{r['channel'][:24]}, {r['platform']}]")
    if top:
        med = statistics.median(float(r["multiple"]) for _, r in top)
        print(f"\nMedian of the 15 closest: {med:.2f}x. Word overlap only: read the titles, not just the number.")
    print("\nVerdict to write in the outline: HOP / FLOP / UNCLEAR + one line why. Log it in "
          "experiments/topic-check-log.md when the video is posted.")


if __name__ == "__main__":
    main()
