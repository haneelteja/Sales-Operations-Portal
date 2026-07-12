#!/usr/bin/env bash
# Generate all required Tauri desktop icons from the 512x512 source PNG.
# Requires: npm install -g @tauri-apps/cli (or use npx)
#
# Usage:
#   bash scripts/generate-desktop-icons.sh
#
# This creates src-tauri/icons/ with all required sizes:
#   32x32.png, 128x128.png, 128x128@2x.png, icon.ico (Windows), icon.icns (macOS)

set -e

SOURCE="public/icons/512x512.png"

if [ ! -f "$SOURCE" ]; then
  echo "Source icon not found: $SOURCE"
  echo "Place a 512x512 PNG at $SOURCE and re-run."
  exit 1
fi

echo "Generating Tauri icons from $SOURCE ..."
npx tauri icon "$SOURCE"
echo "Done. Icons written to src-tauri/icons/"
