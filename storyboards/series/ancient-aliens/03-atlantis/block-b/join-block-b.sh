#!/usr/bin/env bash
# Block B is five storyboards (one per light / place, see make-block-b.mjs). This renders each (draft or full) and joins
# them into one video: out/aa03-b-<frame>[-draft].mp4. A preflight FAIL stops it before any render.
#   bash storyboards/series/ancient-aliens/03-atlantis/block-b/join-block-b.sh wide draft
set -euo pipefail
FRAME="${1:-wide}"; MODE="${2:-}"
cd "$(dirname "$0")/../../../../.."
B=storyboards/series/ancient-aliens/03-atlantis/block-b
FLAGS=(); SUF=""; [ "$MODE" = "draft" ] && FLAGS=(--draft) && SUF="-draft"
mkdir -p out; LIST="out/aa03-b-$FRAME$SUF.txt"; : > "$LIST"
for k in b1 b2 b3 b4 b5; do
  SB="$B/aa03-$k-$FRAME.json"
  node qa/preflight.mjs "$SB" > "out/aa03-$k-$FRAME.preflight.txt" 2>&1 || { tail -20 "out/aa03-$k-$FRAME.preflight.txt"; echo "preflight FAIL: $k"; exit 1; }
  node engine/render.mjs "$SB" "${FLAGS[@]}" --out "out/b-$FRAME$SUF" | tail -2
  F=$(ls -t "out/b-$FRAME$SUF"/aa03-$k-$FRAME*.mp4 | grep -v "\.video\.\|\.part-" | head -1)
  echo "file '$(realpath "$F")'" >> "$LIST"
done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$LIST" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k "out/aa03-b-$FRAME$SUF.mp4"
echo "wrote out/aa03-b-$FRAME$SUF.mp4"
