#!/usr/bin/env bash
# Builds sa3.cpp (Stable Audio 3 in C++/ggml, MIT) for the CPU, downloads the Small SFX + Small Music GGUF weights
# (~3.3 GB, public mirrors of Stability's gated weights) and makes a Python venv for pick.py / sheet.py.
#   engine/soundgen/setup.sh [WORK_DIR]      (default: ~/.cache/viral-engine/soundgen)
# Then start the servers with engine/soundgen/serve.sh. Use "./build.sh cuda" in sa3.cpp on a GPU host instead.
set -euo pipefail
WORK="${1:-$HOME/.cache/viral-engine/soundgen}"
SA3_COMMIT=602af56e411bbff7a4140895cc906b76cfc5a74a
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$WORK" && cd "$WORK"
if [ ! -d sa3.cpp ]; then git clone https://github.com/betweentwomidnights/sa3.cpp; fi
git -C sa3.cpp fetch --depth 1 origin "$SA3_COMMIT" 2>/dev/null || true
git -C sa3.cpp checkout -q "$SA3_COMMIT"
# one of its smoke tests fails to link on some toolchains; the tools we need (sa3-server, sa3-generate) still build
(cd sa3.cpp && ./build.sh cpu) || ls sa3.cpp/build/bin/sa3-server >/dev/null
(cd sa3.cpp && ./models.sh --variant small-sfx && ./models.sh --variant small-music)
python3 -m venv venv
./venv/bin/pip install -q --index-url https://download.pytorch.org/whl/cpu torch==2.14.1
./venv/bin/pip install -q -r "$HERE/requirements.txt"
echo "soundgen ready in $WORK"
