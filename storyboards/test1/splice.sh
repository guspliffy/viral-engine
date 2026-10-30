#!/usr/bin/env bash
# Test 1: joins a farm render of the new opening (frames 0..N-1) with the merged master's frames from N on, and
# keeps the master's sound stream untouched (copied, not re-encoded), so only the opening's picture differs.
#   storyboards/test1/splice.sh <opening.mp4> <master.mp4> <cut_frame> <out.mp4>
# cut_frame = the first frame of the master's first shot after the one take (30 fps: 3.1 s -> 93, 3.0 s -> 90).
set -euo pipefail
open="$1"; master="$2"; n="$3"; out="$4"
ffmpeg -y -loglevel error -i "$open" -i "$master" -filter_complex \
  "[0:v]trim=start_frame=0:end_frame=$n,setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=$n,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" -map 1:a -c:v libx264 -preset slow -crf 16 -profile:v high -r 30 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a copy -movflags +faststart "$out"
echo "$out: $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$out") frames, master $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$master")"
