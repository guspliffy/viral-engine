#!/bin/bash
# Pebble's three matched views (Jonny 7 Nov): front, three-quarter, left profile from the turnaround bench, each as
# colour, plain-shaded (render style "clay") and silhouette, beside his pack at the same cap-to-sole height.
#   tools/pebble/views.sh <name> [H]   -> out/views/<name>/sheet.png   (H: sole-to-cap-top height, tools/pebble/fit.mjs)
set -e; cd "$(dirname "$0")/../.."; N=$1; D=out/views/$N; T=0.2,1.2,2.2; mkdir -p $D/colour $D/clay
H=${2:-$(node tools/pebble/fit.mjs --json $D/fit.json >/dev/null 2>&1; node -e "console.log(require('./$D/fit.json').H_soleToCapTop)")}
node -e "const f=require('fs'),s=JSON.parse(f.readFileSync('storyboards/pebble/pebble-turnaround.json'));delete s.look;s.style='clay';s.id='pebble-turnaround';f.writeFileSync('$D/clay.json',JSON.stringify(s))"
node engine/render.mjs storyboards/pebble/pebble-turnaround.json --stills $T --ids --out $D/colour > $D/colour.log 2>&1
node engine/render.mjs $D/clay.json --stills $T --out $D/clay > $D/clay.log 2>&1
PY=${PY:-/home/user/tts-lab/cb/bin/python}; [ -x "$PY" ] || PY=python3
$PY tools/pebble/views.py --dir $D --H $H
