#!/usr/bin/env python3
"""Lint the notes every session reads, with no AI in it (9 Nov 2026, from the "second brain" linter idea).

A thread only sees the first 4 KB of a memory file and only follows the index and its links, and a rule doc that names
a file that isn't there sends the director looking for it. On 9 Nov 28 of 200 memory files were over 4 KB (Jonny's
"3 fingers + thumb" glove pick sat in the cut-off part of feedback-hand-holds), 12 links pointed at memories that don't
exist, and workflow.md named qa/handcause.mjs, which is only in an open PR. Nothing here judges whether a note is true:
it checks that what is written can be found and read.

  python3 tools/lint-notes.py docs                 rule docs: paths they name exist, CLAUDE.md <= 60 lines, STATE.md <= 40
  python3 tools/lint-notes.py memory [<dir>]       project memory (default: $CLAUDE_COWORK_MEMORY_PATH_OVERRIDE/team/*)
  python3 tools/lint-notes.py memory --brief       one summary line and the first 5 problems, nothing when clean
                                                   (the session-start hook runs this)

Memory rules: frontmatter with name, description and type; name = file name; under 4096 bytes; every [[link]] names an
existing memory; MEMORY.md names only existing files, stays under 200 lines and 25 KB; every feedback-* file is named
by MEMORY.md or linked from another memory (a rule nobody can reach is a rule nobody follows). Exit 1 on any problem.
Standard library only.
"""
import os, re, sys, glob, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
RECALL = 4096                      # bytes of a memory file a session sees
LINK = re.compile(r"\[\[([a-z0-9][a-z0-9-]*)\]\]")
MDREF = re.compile(r"\b([a-z0-9][a-z0-9-]+)\.md\b")


def memory(d):
    d = pathlib.Path(d)
    idx_file = d / "MEMORY.md"
    files = {p.stem: p for p in d.glob("*.md") if p.name != "MEMORY.md"}
    errs, inbound, names = [], {k: 0 for k in files}, {}
    for stem, p in sorted(files.items()):
        t = p.read_text(errors="replace")
        size = len(t.encode())
        if size > RECALL:
            errs.append(f"{p.name}: {size} bytes, a session sees only the first {RECALL}: split it by subject or summarise it")
        if not t.startswith("---\n") or t.find("\n---", 4) < 0:
            errs.append(f"{p.name}: no frontmatter"); continue
        fm = t[4:t.find("\n---", 4)]
        for k in ("name", "description", "type"):
            if not re.search(rf"^\s*{k}:\s*\S", fm, re.M):
                errs.append(f"{p.name}: frontmatter lacks {k}")
        m = re.search(r"^name:\s*(\S+)", fm, re.M)
        if m:
            names[m.group(1)] = stem
            if m.group(1) != stem:
                errs.append(f"{p.name}: name {m.group(1)} differs from the file name")
    for stem, p in sorted(files.items()):
        t = p.read_text(errors="replace")
        for l in LINK.findall(t):
            tgt = names.get(l, l if l in files else None)
            if tgt is None:
                errs.append(f"{p.name}: [[{l}]] names no memory")
            elif tgt != stem:
                inbound[tgt] += 1
        for r in MDREF.findall(t):
            if r in files and r != stem:
                inbound[r] += 1
    if idx_file.exists():
        idx = idx_file.read_text(errors="replace")
        lines = idx.count("\n") + 1
        if lines > 200 or len(idx.encode()) > 25000:
            errs.append(f"MEMORY.md: {lines} lines, {len(idx.encode())} bytes: a session loads only 200 lines or 25 KB")
        for r in sorted(set(MDREF.findall(idx))):
            if r in files:
                inbound[r] += 1
            elif r != "MEMORY":
                errs.append(f"MEMORY.md names {r}.md, which isn't in memory")
        for l in LINK.findall(idx):
            if names.get(l, l) in inbound:
                inbound[names.get(l, l)] += 1
    else:
        errs.append("MEMORY.md is missing")
    for stem in sorted(files):
        if stem.startswith("feedback-") and inbound[stem] == 0:
            errs.append(f"{stem}.md: a feedback rule no index line or other memory points to")
    return errs, len(files)


def docs():
    errs = []
    paths = ["CLAUDE.md", "qa/REVIEW.md", *sorted(glob.glob("docs/rules/*.md", root_dir=ROOT)),
             *sorted(glob.glob("docs/templates/*.md", root_dir=ROOT)), *sorted(glob.glob(".claude/agents/*.md", root_dir=ROOT))]
    ref = re.compile(r"(?<![\w/.-])((?:qa|engine|storyboards|tools|docs|assets|characters|puppet)/[A-Za-z0-9_./-]+\.(?:json|mjs|js|py|md|sh|yml))(?![A-Za-z0-9])")
    for f in paths:
        p = ROOT / f
        if not p.exists():
            continue
        for line_no, line in enumerate(p.read_text().splitlines(), 1):
            for r in ref.findall(line):
                if "<" in r or "*" in r:
                    continue
                # /mnt/project-files/... paths are the project's files, not the repo's
                start = line.find(r)
                if start > 0 and line[max(0, start - 20):start].rstrip().endswith(("project-files/", "/mnt/project-files")):
                    continue
                if line[:start].rstrip().endswith("/"):
                    continue
                if not (ROOT / r).exists():
                    errs.append(f"{f}:{line_no}: names {r}, which isn't in the repo")
    for f, cap in (("CLAUDE.md", 60), ("docs/STATE.md", 40)):
        p = ROOT / f
        if p.exists():
            n = len(p.read_text().splitlines())
            if n > cap:
                errs.append(f"{f}: {n} lines, the cap is {cap} (workflow.md)")
    return errs


def main(argv):
    if not argv or argv[0] not in ("docs", "memory"):
        print(__doc__); return 2
    brief = "--brief" in argv
    args = [a for a in argv[1:] if not a.startswith("--")]
    if argv[0] == "docs":
        errs, what = docs(), "rule docs"
    else:
        dirs = args or sorted(glob.glob(os.path.join(os.environ.get("CLAUDE_COWORK_MEMORY_PATH_OVERRIDE", "/tmp/claude/memory"), "team", "*")))
        dirs = [d for d in dirs if os.path.isdir(d)]
        if not dirs:
            if not brief:
                print("lint-notes: no memory folder found")
            return 0
        errs, n = [], 0
        for d in dirs:
            e, k = memory(d); errs += e; n += k
        what = f"{n} memory files"
    if brief:
        if errs:
            print(f"lint-notes: {len(errs)} problem(s) in {what} (python3 tools/lint-notes.py {argv[0]} for all):")
            for e in errs[:5]:
                print("  " + e)
        return 0
    for e in errs:
        print(e)
    print(f"lint-notes: {len(errs)} problem(s) in {what}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
