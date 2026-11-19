#!/usr/bin/env bash
# Join the nine segment renders of EP05 in story order, then speed up like EP04 (Jonny 19 Nov): the hook (story 0-7.3 s) at
# 1.05x, the rest at 1.15x (picture and sound together; atempo keeps the pitch).
#   bash storyboards/series/ancient-aliens/05-sphinx/join.sh [draft|final] [out.mp4]
set -euo pipefail
cd "$(dirname "$0")/../../../.."
KIND=${1:-draft}; OUT=${2:-out/eg05-sphinx-JOIN-$KIND.mp4}
SUF=$([ "$KIND" = draft ] && echo "-anime-pro-draft" || echo "-anime-pro")
LIST=$(mktemp); for i in 0 1 2 3 4 5 6 7 8; do echo "file '$PWD/out/eg05-$i-tall$SUF.mp4'" >> "$LIST"; done
RAW=$(mktemp --suffix .mp4)
ffmpeg -v error -y -f concat -safe 0 -i "$LIST" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k "$RAW"
H=7.3
ffmpeg -v error -y -i "$RAW" -filter_complex \
  "[0:v]trim=0:$H,setpts=(PTS-STARTPTS)/1.05[v0];[0:a]atrim=0:$H,asetpts=PTS-STARTPTS,atempo=1.05[a0];\
   [0:v]trim=start=$H,setpts=(PTS-STARTPTS)/1.15[v1];[0:a]atrim=start=$H,asetpts=PTS-STARTPTS,atempo=1.15[a1];\
   [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a];[v]fps=30[vo]" \
  -map "[vo]" -map "[a]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k "$OUT"
rm -f "$LIST" "$RAW"
echo "wrote $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s)"
