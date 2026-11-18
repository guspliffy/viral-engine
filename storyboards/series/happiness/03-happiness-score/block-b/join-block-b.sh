#!/usr/bin/env bash
# Block B is six storyboards (one per place, see make-block-b.mjs). This renders each (draft or full) and joins them into
# one video: out/hs03-b-<frame>[-draft].mp4. A preflight FAIL stops it before any render.
#   bash storyboards/series/happiness/03-happiness-score/block-b/join-block-b.sh wide draft
set -euo pipefail
FRAME="${1:-wide}"; MODE="${2:-}"
cd "$(dirname "$0")/../../../../.."
B=storyboards/series/happiness/03-happiness-score/block-b
FLAGS=(); SUF=""; [ "$MODE" = "draft" ] && FLAGS=(--draft) && SUF="-draft"
mkdir -p "out/hs03b-$FRAME$SUF"; LIST="out/hs03-b-$FRAME$SUF.txt"; : > "$LIST"
for k in b1 b2 b3 b4 b5 b6; do
  SB="$B/hs03-$k-$FRAME.json"
  node qa/preflight.mjs "$SB" > "out/hs03-$k-$FRAME.preflight.txt" 2>&1 || { tail -20 "out/hs03-$k-$FRAME.preflight.txt"; echo "preflight FAIL: $k"; exit 1; }
  node engine/render.mjs "$SB" "${FLAGS[@]}" --out "out/hs03b-$FRAME$SUF" | tail -2
  F=$(ls -t "out/hs03b-$FRAME$SUF"/hs03-$k-$FRAME*.mp4 | grep -v "\.video\.\|\.part-" | head -1)
  echo "file '$(realpath "$F")'" >> "$LIST"
done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$LIST" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k "out/hs03-b-$FRAME$SUF.mp4"
echo "wrote out/hs03-b-$FRAME$SUF.mp4"
