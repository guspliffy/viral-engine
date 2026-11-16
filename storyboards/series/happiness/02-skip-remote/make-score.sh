#!/usr/bin/env bash
# Skip remote (Happiness 02) score, rough-draft version: three library takes (assets/music/ai, its manifest has source and
# licence), loudness-matched and laid on the beats of make-skip-remote.mjs (NOTES.md score plan). Change them together.
#   0.0-24.7  sneaky pizzicato (the skips), looped, 4 dB thinner from 19.6 (the bench), out on the cut to 82
#   24.7-36.6 sad piano (82, the TV), out on the rewind cut
#   36.6-52.2 calm landscape orchestra (back in the jam, the sunset), 1.5 s fade at the end
set -euo pipefail
cd "$(dirname "$0")/../../../.."
A=assets/music/ai OUT=assets/music/skip-remote/skip-remote-score.ogg
ffmpeg -y -loglevel error \
  -stream_loop 1 -i $A/sneaky/sneaky-01.ogg -i $A/sad/sad-02.ogg -i $A/calm-landscape/calm-landscape-01.ogg -filter_complex "
[0:a]loudnorm=I=-16:TP=-1.5,atrim=0:24.9,asetpts=PTS-STARTPTS,volume='if(gte(t,19.6),0.63,1)':eval=frame,afade=t=out:st=24.55:d=0.3[a];
[1:a]loudnorm=I=-16:TP=-1.5,atrim=0:12.2,asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st=11.6:d=0.3,adelay=24700|24700[b];
[2:a]loudnorm=I=-16:TP=-1.5,atrim=0:15.6,asetpts=PTS-STARTPTS,afade=t=in:d=0.4,afade=t=out:st=14.1:d=1.5,adelay=36600|36600[c];
[a][b][c]amix=inputs=3:normalize=0:duration=longest,atrim=0:52.2,aresample=44100[o]" -map "[o]" -c:a libvorbis -q:a 6 $OUT
echo "wrote $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT) s)"
