#!/usr/bin/env bash
# Renders every segment of the Mona Lisa fact story as a draft (two at a time) and joins them into the rough draft
# out/ml01-draft/ml01-ROUGH.mp4 (720x1280). Segments already rendered are kept (delete out/ml01-draft/<id>*.mp4 to redo
# one). FORCE=1 passes --force: only for the ROUGH story-check draft (workflow rule 2), never for the final.
#   bash storyboards/series/facts/01-mona-lisa/render-draft.sh
set -uo pipefail
cd "$(dirname "$0")/../../../.."
D=storyboards/series/facts/01-mona-lisa
O=${O:-out/ml01-draft}; mkdir -p "$O"
IDS=$(python3 -c "import json;print(' '.join(s['id'] for s in json.load(open('$D/SEGMENTS.json'))['segs']))")
one() {
  local id=$1
  if ls "$O"/$id-*draft.mp4 >/dev/null 2>&1; then echo "have $id"; return; fi
  local s=$(date +%s)
  node engine/render.mjs "$D/$id.json" --draft ${FORCE:+--force} --out "$O" > "$O/$id.log" 2>&1 && echo "done $id $(( $(date +%s) - s ))s" || { echo "FAIL $id"; tail -5 "$O/$id.log"; }
}
export -f one; export O D FORCE
echo $IDS | tr ' ' '\n' | xargs -P 2 -I{} bash -c 'one {}'
LIST="$O/list.txt"; : > "$LIST"
for id in $IDS; do F=$(ls "$O"/$id-*draft.mp4 2>/dev/null | grep -v "\.video\.\|\.part-" | head -1); [ -n "$F" ] && echo "file '$(realpath "$F")'" >> "$LIST" || echo "MISSING $id"; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$LIST" -vf scale=720:1280 -c:v libx264 -crf 25 -preset medium -pix_fmt yuv420p -c:a aac -b:a 160k "$O/ml01-ROUGH.mp4"
echo "wrote $O/ml01-ROUGH.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$O/ml01-ROUGH.mp4") s"
