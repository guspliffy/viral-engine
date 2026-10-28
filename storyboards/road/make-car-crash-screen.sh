#!/bin/sh
# The phone screen's video for the car crash clip: renders 12 draft stills of the roll and a full-size first frame,
# and packs them into assets/screens/car-crash/ (atlas.jpg 4x3 tiles, next.jpg). The screen faces away from the
# camera in all of these, so what it shows can't change them. Run after make-car-crash.mjs, before the final render.
set -e
cd "$(dirname "$0")/../.."
SB=storyboards/road/car-crash-v2.json
TIMES=$(node storyboards/road/make-car-crash.mjs | sed -n 's/^screen: //p')
node engine/render.mjs $SB --stills "$TIMES" --draft --force > /dev/null
node engine/render.mjs $SB --stills 0 --force > /dev/null
ID=$(node -e "const s=require('./$SB');console.log(s.id+'-'+s.look)")
ARGS=""; for t in $(echo "$TIMES" | tr ',' ' '); do ARGS="$ARGS -i out/$ID-draft-t$(printf '%.2f' $t).png"; done
ffmpeg -y -loglevel error $ARGS -filter_complex "$(i=0; for t in $(echo "$TIMES" | tr ',' ' '); do printf '[%d]scale=540:960[v%d];' $i $i; i=$((i+1)); done; for i in 0 1 2 3 4 5 6 7 8 9 10 11; do printf '[v%d]' $i; done; printf 'xstack=inputs=12:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|0_h0+h4|w0_h0+h4|w0+w1_h0+h4|w0+w1+w2_h0+h4')" -q:v 3 assets/screens/car-crash/atlas.jpg
ffmpeg -y -loglevel error -i out/$ID-t0.00.png -q:v 2 assets/screens/car-crash/next.jpg
echo "screen: atlas.jpg + next.jpg written"
