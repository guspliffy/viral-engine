#!/usr/bin/env bash
# Reference | hand-made | motion capture, at normal speed and then at half speed, for Jonny's go or no-go on a move.
#   tools/mocap/side-by-side.sh <ref frames dir (stick.py --frames)> <hand.mp4> <mocap.mp4> <out.mp4> [crop]
# crop (optional): an ffmpeg crop for the two potato panels, e.g. 720:1280:180:420 on a 1080x1920 render (a close-up)
set -euo pipefail
REF=$1 HAND=$2 MOCAP=$3 OUT=$4 CROP=${5:-}
W=540 H=960
FONT=$(fc-match -f '%{file}' 'DejaVu Sans:bold' 2>/dev/null || true)
lab() { echo "drawtext=fontfile=$FONT:text='$1':x=(w-tw)/2:y=24:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=10"; }
pre=""; [ -n "$CROP" ] && pre="crop=$CROP,"
FC="[0:v]scale=$W:$H,setsar=1,$(lab 'PERSON (CMU mocap)')[r];\
[1:v]${pre}scale=$W:$H,setsar=1,$(lab 'HAND-MADE (today)')[h];\
[2:v]${pre}scale=$W:$H,setsar=1,$(lab 'FROM MOCAP')[m];\
[r][h][m]hstack=inputs=3:shortest=1,split[a][b];\
[b]setpts=2*PTS,drawtext=fontfile=$FONT:text='HALF SPEED':x=(w-tw)/2:y=h-70:fontsize=34:fontcolor=yellow:box=1:boxcolor=black@0.6:boxborderw=10[s];\
[a][s]concat=n=2:v=1:a=0,fps=30,format=yuv420p[v]"
ffmpeg -v error -y -framerate 30 -i "$REF/%05d.png" -i "$HAND" -i "$MOCAP" -filter_complex "$FC" -map "[v]" -c:v libx264 -crf 18 -preset medium -movflags +faststart "$OUT"
echo "wrote $OUT"
