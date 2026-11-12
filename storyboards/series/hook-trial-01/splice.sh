#!/usr/bin/env bash
# Hook trial 1: the posted picture from frame CUT on, the re-cut's own render before it, the re-cut's full soundtrack.
#   storyboards/series/hook-trial-01/splice.sh <posted.mp4> <opening.video.mp4> <recut.wav> <out.mp4> [cut_frame=90]
# opening.video.mp4 = `node engine/render.mjs <key>-stake.json --from 0 --to 3.5` (picture only);
# recut.wav = `node engine/render.mjs <key>-stake.json --audio-only` (it writes the levelled mix before it stops).
set -euo pipefail
POSTED=$1 OPEN=$2 WAV=$3 OUT=$4 CUT=${5:-90}
ffmpeg -v error -y -i "$OPEN" -i "$POSTED" -i "$WAV" -filter_complex \
  "[0:v]trim=end_frame=${CUT},setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=${CUT},setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 16 -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
