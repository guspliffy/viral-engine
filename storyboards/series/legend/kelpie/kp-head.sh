#!/bin/bash
# Swap the opening banner without re-rendering the film: only frames 0..74 (2.5 s) depend on TITLE.
#   TITLE=<style> bash storyboards/series/legend/kelpie/kp-head.sh   (repo root; needs out/legend-kelpie/pic-subs.full.mp4 + pic-nosubs.full.mp4 = the outputs of kp-render.mjs)
# then mux with the mix: ffmpeg -i out/legend-kelpie/pic2-subs.mp4 -i out/legend-kelpie/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t <DUR> kp-draft1.mp4   (same for -nosubs)
set -e
O=out/legend-kelpie; N=90
node storyboards/series/legend/kelpie/kp-render.mjs $O/head-subs.mp4 $O/head-nosubs.mp4 --from 0 --to 3
for v in subs nosubs; do
  ffmpeg -v error -y -i $O/head-$v.mp4 -i $O/pic-$v.full.mp4 -filter_complex "[0:v]trim=end_frame=$N,setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=$N,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,fps=30[o]" -map "[o]" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p $O/pic2-$v.mp4
done
