#!/usr/bin/env bash
# Starts the two sa3-server instances generate.py talks to: small-sfx on :8006, small-music on :8007.
#   engine/soundgen/serve.sh [WORK_DIR] [THREADS]
set -euo pipefail
WORK="${1:-$HOME/.cache/viral-engine/soundgen}"; THREADS="${2:-$(nproc)}"
export SA3_MODELS_DIR="$WORK/sa3.cpp/models"
BIN="$WORK/sa3.cpp/build/bin/sa3-server"
nohup "$BIN" --model small-sfx --port 8006 --threads "$THREADS" > "$WORK/server-sfx.log" 2>&1 &
nohup "$BIN" --model small-music --port 8007 --threads "$THREADS" > "$WORK/server-music.log" 2>&1 &
echo "sa3-server: small-sfx :8006, small-music :8007 (logs in $WORK)"
