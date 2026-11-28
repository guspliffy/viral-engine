#!/bin/bash
# Swap the opening banner without re-rendering the film: only frames 0..89 (3.0 s) depend on TITLE.
#   TITLE=marble bash storyboards/series/legend/cried-wolf/cw-head.sh        (from the repo root; needs the full render copied to out/legend-wolf/pic-subs.full.mp4 + pic-nosubs.full.mp4 (outputs of cw-render.mjs))
# It renders the head with that banner and splices it onto the unchanged rest, then mux with the mix:
#   ffmpeg -i out/legend-wolf/pic2-subs.mp4 -i out/legend-wolf/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t <DUR> cw-draft2.mp4   (same for -nosubs)
set -e
O=out/legend-wolf; N=90
node storyboards/series/legend/cried-wolf/cw-render.mjs $O/head-subs.mp4 $O/head-nosubs.mp4 --from 0 --to 3
for v in subs nosubs; do
  ffmpeg -v error -y -i $O/head-$v.mp4 -i $O/pic-$v.full.mp4 -filter_complex "[0:v]trim=end_frame=$N,setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=$N,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,fps=30[o]" -map "[o]" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p $O/pic2-$v.mp4
done
