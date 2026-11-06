#!/bin/bash
# Side by side for a motion change (CLAUDE.md "Movement"): the same band of two renders stacked (old above, new
# below), at normal speed and at half speed, silent. The band keeps each render's own label at the top.
#   tools/motion/side-by-side.sh <old.mp4> <new.mp4> <out-prefix> [y0=230] [h=960]
set -e
A=$1; B=$2; OUT=$3; Y=${4:-230}; H=${5:-960}
F="[0:v]crop=1080:$H:0:$Y[a];[1:v]crop=1080:$H:0:$Y[b];[a][b]vstack=inputs=2,scale=-2:'min(1920,ih)'"
ffmpeg -v error -y -i "$A" -i "$B" -filter_complex "$F[v]" -map "[v]" -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p "$OUT.mp4"
ffmpeg -v error -y -i "$A" -i "$B" -filter_complex "$F,setpts=2*PTS[v]" -map "[v]" -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p "$OUT-half-speed.mp4"
echo "$OUT.mp4 $OUT-half-speed.mp4"
