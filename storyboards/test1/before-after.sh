#!/usr/bin/env bash
# Test 1: the first T seconds of the master (three cuts) and the one take side by side, full speed with the master's
# sound, then again at half speed (silent).   storyboards/test1/before-after.sh <master.mp4> <onetake.mp4> <T> <out.mp4>
set -euo pipefail
m="$1"; o="$2"; t="$3"; out="$4"
font=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
lab() { echo "drawtext=fontfile=$font:text='$1':x=(w-tw)/2:y=h-60:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=10"; }
ffmpeg -y -loglevel error -i "$m" -i "$o" -filter_complex "
 [0:v]trim=0:$t,setpts=PTS-STARTPTS,scale=540:960,$(lab 'BEFORE three cuts')[a];
 [1:v]trim=0:$t,setpts=PTS-STARTPTS,scale=540:960,$(lab 'AFTER one take')[b];
 [a][b]hstack,split[f][h0];
 [h0]setpts=2*PTS,drawtext=fontfile=$font:text='half speed':x=(w-tw)/2:y=24:fontsize=36:fontcolor=yellow:box=1:boxcolor=black@0.6:boxborderw=10[h];
 [0:a]atrim=0:$t,asetpts=PTS-STARTPTS[fa];
 anullsrc=r=44100:cl=stereo,atrim=0:$(echo "$t*2" | bc)[ha];
 [f][fa][h][ha]concat=n=2:v=1:a=1[v][au]" \
 -map "[v]" -map "[au]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart "$out"
echo "$out"
