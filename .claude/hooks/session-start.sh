#!/bin/bash
# Cloud sessions start in a fresh container: the node packages (three, three-mesh-bvh, playwright-core, rapier) and
# OpenCV for qa/check.mjs's flow check weren't there, and threads lost turns finding that out (a layout failing on a
# missing three-mesh-bvh, qa/check crashing without cv2: 8-9 Nov 2026). Each install runs only when what decides it
# changed since it last succeeded. Synchronous, so the first command of a session finds them.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# node packages (package.json / package-lock.json); the hash lives in node_modules, so it goes with the packages
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  npm install --no-audit --no-fund
  sha256sum .claude/hooks/session-start.sh package.json package-lock.json > "$hashes" || rm -f "$hashes"
fi

# Python for the checks: OpenCV (qa/flow.py, the glitch check in qa/check.mjs) and numpy (qa/pace.py), into the system
# Python, with the hash in that Python's package directory
pyhashes="$(python3 -I -c 'import sysconfig; print(sysconfig.get_path("purelib"))')/.session-start.sha256"
if ! sha256sum --check --status "$pyhashes" 2>/dev/null; then
  rm -f "$pyhashes"
  python3 -m pip install --quiet --disable-pip-version-check opencv-python-headless numpy \
    || python3 -m pip install --quiet --disable-pip-version-check --break-system-packages opencv-python-headless numpy
  sha256sum .claude/hooks/session-start.sh > "$pyhashes" || rm -f "$pyhashes"
fi

# Project memory: a session sees only the first 4 KB of a memory file and only what the index or a link reaches
# (28 of 200 files were cut off on 9 Nov). Prints nothing when clean, else one line and the first 5 problems.
python3 -I tools/lint-notes.py memory --brief || true
