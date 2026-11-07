#!/usr/bin/env bash
# Fetches the Effekseer sample effects that engine/page/vfx.js names (VFX) into assets/vfx/effekseer/ (git-ignored).
# Source: https://github.com/effekseer/ResourceData (samples/), the Effekseer project's own sample data. Its terms are
# not written down in that repository, so the files stay out of this repo until that is settled (vfx-effekseer-01).
# Pinned to one commit so every machine draws the same effects.
set -euo pipefail
cd "$(dirname "$0")/../.."
REV=${EFK_REV:-446ed7ab17ffee65738aa470fff0dec3a7ee17e8}
DIR=$(mktemp -d)
git clone -q --filter=blob:none --no-checkout https://github.com/effekseer/ResourceData "$DIR"
git -C "$DIR" checkout -q "$REV" -- samples/02_Tktk03 samples/00_Version16 samples/00_Basic
mkdir -p assets/vfx/effekseer
cp -r "$DIR"/samples/02_Tktk03 "$DIR"/samples/00_Version16 "$DIR"/samples/00_Basic assets/vfx/effekseer/
echo "effects from effekseer/ResourceData $(git -C "$DIR" rev-parse --short HEAD) -> assets/vfx/effekseer/"
rm -rf "$DIR"
