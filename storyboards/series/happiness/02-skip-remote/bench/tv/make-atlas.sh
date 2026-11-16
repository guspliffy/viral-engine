#!/bin/sh
# The bench's test pictures for the box TV's screen (task T9), made from a repo PNG so nothing new is drawn:
# a 4:3 crop of panel 16 of skip-remote-sheet-2.png (the two of them in the car) as the single still, and 24 tiles
# of it with the hue walked round and the tile number burned in, montaged 6 cols x 4 rows (DESIGN section 5's shape:
# 6 x 4 tiles of 512 x 384). Run from the repo root; ImageMagick only.
set -e
BD=storyboards/series/happiness/02-skip-remote/bench/tv
T=$(mktemp -d)
convert $BD/../../skip-remote-sheet-2.png -crop 300x225+4+650 +repage -resize 512x384! -colors 128 -strip $BD/still.png
i=0
while [ $i -lt 24 ]; do
  convert $BD/still.png -modulate 100,110,$((100 + i * 4)) -fill white -undercolor '#00000080' \
    -pointsize 64 -font DejaVu-Sans-Bold -gravity southwest -annotate +12+10 " $i " "$T/$(printf %02d $i).png"
  i=$((i + 1))
done
montage "$T"/[0-9][0-9].png -tile 6x4 -geometry 512x384+0+0 -background black png:- | convert - -colors 96 -strip $BD/atlas-6x4.png
rm -rf "$T"
