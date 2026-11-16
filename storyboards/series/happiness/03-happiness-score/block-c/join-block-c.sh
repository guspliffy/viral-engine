#!/usr/bin/env bash
# Joins block C's four renders (c1 room, c2 memory, c3 room, c4 street) into the block's wide video.
# The memory goes in and out with the film's one dissolve (DESIGN 7: 6 frames, the page becomes the picture); c3 -> c4 is a hard cut.
#   bash storyboards/series/happiness/03-happiness-score/block-c/join-block-c.sh [suffix] [out.mp4]
#   suffix: "-anime-pro-draft" (default, the animatic) or "-anime-pro" (a full render)
set -euo pipefail
cd "$(dirname "$0")/../../../../.."
SUF="${1:--anime-pro-draft}"
OUT="${2:-out/hs03-block-c-wide${SUF}.mp4}"
F=(out/hs03-c1-wide$SUF.mp4 out/hs03-c2-wide$SUF.mp4 out/hs03-c3-wide$SUF.mp4 out/hs03-c4-wide$SUF.mp4)
for f in "${F[@]}"; do [ -f "$f" ] || { echo "missing $f"; exit 1; }; done
len() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
X=0.2   # 6 frames
L1=$(len "${F[0]}"); L2=$(len "${F[1]}")
O1=$(python3 -c "print(round($L1-$X,3))"); O2=$(python3 -c "print(round($L1+$L2-2*$X,3))")
ffmpeg -v error -y -i "${F[0]}" -i "${F[1]}" -i "${F[2]}" -i "${F[3]}" -filter_complex "
[0:v]settb=1/30,fps=30,format=yuv420p[v0];[1:v]settb=1/30,fps=30,format=yuv420p[v1];[2:v]settb=1/30,fps=30,format=yuv420p[v2];[3:v]settb=1/30,fps=30,format=yuv420p[v3];
[v0][v1]xfade=transition=fade:duration=$X:offset=$O1[v01];[v01][v2]xfade=transition=fade:duration=$X:offset=$O2[v012];[v012][v3]concat=n=2:v=1:a=0[v];
[0:a][1:a]acrossfade=d=$X:c1=tri:c2=tri[a01];[a01][2:a]acrossfade=d=$X:c1=tri:c2=tri[a012];[a012][3:a]concat=n=2:v=0:a=1[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "wrote $OUT ($(len "$OUT") s)"
