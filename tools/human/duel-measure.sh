#!/usr/bin/env bash
# Measures where the fire leaves each fighter's drawn palms and feet in one act of the firebender duel, then writes the
# act again with those sources (tools/human/make-duel-01.mjs reads storyboards/human/duel/duel-01-<act>.src.<A|B>.json).
#   tools/human/duel-measure.sh <street|alley|roof|v2>      (two layout passes, ~2 min each)
set -euo pipefail
ACT="${1:?act: street, alley, roof or v2}"
ID="duel-01-$ACT"; [ "$ACT" = v2 ] && ID="duel-02"
SB="storyboards/human/duel/$ID.json"
TMP="out/duel-measure"; mkdir -p "$TMP"
rm -f "storyboards/human/duel/$ID.src.A.json" "storyboards/human/duel/$ID.src.B.json"
for W in A B; do
  DIAG=$W node tools/human/make-duel-01.mjs "$ACT" > /dev/null
  node engine/render.mjs "$SB" --layout --skip-gate --out "$TMP/$ACT-$W" > "$TMP/$ACT-$W.log" 2>&1
  node tools/human/firebend-src.mjs "$TMP/$ACT-$W.log" "storyboards/human/duel/$ID.src.$W.json"
done
node tools/human/make-duel-01.mjs "$ACT"
