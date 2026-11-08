#!/usr/bin/env bash
# Splice a re-rendered opening onto an approved clip's unchanged rest, then let render.mjs lay the full sound on it.
# Used for the reach rules v3 openings (7 Nov 2026): the opening changes, everything after the seam is the same
# storyboard, so its frames are taken from the approved render instead of drawn again.
#
#   tools/splice-opening.sh <new storyboard.json> <opening.mp4> <frames to keep> <approved.mp4> <its first frame to use>
#
# <opening.mp4> is `render.mjs <sb> --from 0 --to T` (its first <frames to keep> frames are used); the approved clip
# continues from <its first frame to use>. Writes out/<id>-anime-pro.video.mp4 and runs --audio-only, which writes
# out/<id>-anime-pro.mp4 with the whole new storyboard's sound (music, voices, effects on the new clock).
set -euo pipefail
SB=$1 OPEN=$2 KEEP=$3 OLD=$4 FROM=$5
cd "$(dirname "$0")/.."
ID=$(node -e "console.log(require('./$SB').id)")
VID=out/$ID-anime-pro.video.mp4
ffmpeg -loglevel error -y -i "$OPEN" -i "$OLD" -filter_complex \
  "[0:v]trim=end_frame=$KEEP,setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=$FROM,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -r 30 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -an "$VID"
echo "spliced $KEEP new + approved from frame $FROM -> $VID ($(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$VID") frames)"
node engine/render.mjs "$SB" --audio-only
