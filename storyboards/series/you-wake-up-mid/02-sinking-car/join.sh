#!/usr/bin/env bash
# Joins the lake clip and the burning-house clip (one set per storyboard) into the episode.
# usage: join.sh <lake.mp4> <fire.mp4> <out.mp4>
set -euo pipefail
ffmpeg -y -loglevel error -i "$1" -i "$2" -filter_complex \
  "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$3"
