#!/usr/bin/env bash
set -e
mkdir -p public/icons
# 512x512
convert -size 512x512 xc:"#1e3a8a" -gravity center -pointsize 200 -fill white -annotate 0 "B" public/icons/icon-512.png
# 192x192
convert -size 192x192 xc:"#1e3a8a" -gravity center -pointsize 80 -fill white -annotate 0 "B" public/icons/icon-192.png
echo "Icons created in public/icons/"