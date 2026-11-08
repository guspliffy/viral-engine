#!/bin/sh
# Blender 4.2 LTS + MPFB2 (MakeHuman, code GPL-3, assets CC0) + VRM Add-on for Blender (MIT) for the own-character
# pipeline (Jonny's OK 8 Nov 2026). Installs into /home/user/tools and links the add-ons as Blender extensions.
set -e
T=/home/user/tools; mkdir -p $T; cd $T
[ -x blender-4.2.3-linux-x64/blender ] || { curl -sL https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz | tar xJ; }
[ -d mpfb2-src ] || git clone --depth 1 https://github.com/makehumancommunity/mpfb2 mpfb2-src
[ -d vrm-addon-src ] || git clone --depth 1 https://github.com/saturday06/VRM-Addon-for-Blender vrm-addon-src
D=~/.config/blender/4.2/extensions/user_default; mkdir -p $D
ln -sfn $T/mpfb2-src/src/mpfb $D/mpfb
ln -sfn $T/vrm-addon-src/src/io_scene_vrm $D/vrm
echo "blender: $T/blender-4.2.3-linux-x64/blender"
