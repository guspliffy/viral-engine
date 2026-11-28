#!/bin/bash
# Review pack for Sol:  bash storyboards/series/legend/kelpie/kp-pack.sh <video-with-subs.mp4> <outdir>   (from the repo root)
#   beats.txt, sheet-1fps-*.jpg (12x4 tiles, 180 px), strip-5fps-XXs.jpg (10x5 tiles, 160 px per 10 s)
set -e
V=$1; D=$2; mkdir -p $D; T=$(mktemp -d)
node storyboards/series/legend/kelpie/kp-beats.mjs > $D/beats.txt
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $V | cut -d. -f1)
ffmpeg -v error -y -i $V -vf "fps=1,scale=180:-1" $T/s%03d.png
N=$(ls $T/s*.png | wc -l)
montage $(ls $T/s*.png | sed -n 1,48p) -tile 12x4 -geometry +0+0 -quality 80 $D/sheet-1fps-00-47s.jpg
montage $(ls $T/s*.png | sed -n 49,96p) -tile 12x4 -geometry +0+0 -quality 80 $D/sheet-1fps-48-$(printf %02d $((N-1)))s.jpg
for S in $(seq 0 10 $((DUR))); do
  rm -f $T/f*.png
  ffmpeg -v error -y -ss $S -t 10 -i $V -vf "fps=5,scale=160:-1" $T/f%03d.png
  [ -f $T/f001.png ] || continue
  montage $(ls $T/f*.png | head -50) -tile 10x5 -geometry +0+0 -quality 80 $D/strip-5fps-$(printf %02d $S)s.jpg
done
rm -rf $T
