#!/usr/bin/env bash
# Block B's animatic music bed (50 s, block time = file time), from the kit's MUSIC row b plus the party's song:
#   0.0-12.3  "sad" (the mirror, the kettle, the puddle), out over 0.7 s
#  12.6-43.2  "elevator-bossa" looped = their old song from Mash's speaker (91.9 bpm, the dancers' beat). Clear while the
#             camera is with the dancers (12.6-20.0), muffled (low-pass 700 Hz, -5 dB) from Spud's corner (20.0-42.6)
#  42.4-50.0  "calm-landscape" in under the balcony and the empty room
# Director: the film's score replaces this at the join.
#   bash storyboards/series/happiness/03-happiness-score/block-b/make-music-b.sh
set -euo pipefail
cd "$(dirname "$0")/../../../../.."
M=assets/music/ai; OUT=assets/music/score-film/block-b-animatic.ogg; mkdir -p "$(dirname "$OUT")"
ffmpeg -hide_banner -loglevel error -y \
  -i $M/sad/sad-02.ogg \
  -stream_loop 3 -i $M/elevator-bossa/elevator-bossa-01.ogg \
  -i $M/calm-landscape/calm-landscape-01.ogg \
  -filter_complex "
   [0:a]aresample=48000,atrim=0:12.3,afade=t=in:d=0.05,afade=t=out:st=11.6:d=0.7,asetpts=PTS-STARTPTS[sad];
   [1:a]aresample=48000,atrim=0:30.6,asetpts=PTS-STARTPTS,asplit=2[b1][b2];
   [b1]volume=eval=frame:volume='if(lt(t,7.4),1,max(0,1-(t-7.4)/0.25))',afade=t=in:d=0.08[clear];
   [b2]lowpass=f=700,lowpass=f=900,volume=eval=frame:volume='0.56*min(1,max(0,(t-7.4)/0.25))',afade=t=out:st=29.8:d=0.8[muff];
   [clear][muff]amix=inputs=2:normalize=0,adelay=12600|12600[bossa];
   [2:a]aresample=48000,atrim=0:7.6,afade=t=in:d=0.6,volume=0.9,adelay=42400|42400[calm];
   [sad][bossa][calm]amix=inputs=3:normalize=0:duration=longest,apad=whole_dur=50,atrim=0:50[out]" \
  -map "[out]" -c:a libvorbis -q:a 5 "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
