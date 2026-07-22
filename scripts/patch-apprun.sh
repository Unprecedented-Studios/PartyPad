#!/usr/bin/env bash
set -euo pipefail

APPIMAGE="release/PartyPad-2.0.0.AppImage"
SQUASHFS_DIR="squashfs-root"
RUNTIME="runtime"
SQUASHFS="fs.squashfs"

echo "==> Patching AppRun to always use --no-sandbox..."

rm -rf "$SQUASHFS_DIR" "$RUNTIME" "$SQUASHFS"

"$APPIMAGE" --appimage-extract > /dev/null 2>&1

if [ ! -f "$SQUASHFS_DIR/AppRun" ]; then
  echo "ERROR: extraction failed, no AppRun found" >&2
  exit 1
fi

sed -i 's/^NO_SANDBOX=()$/NO_SANDBOX=(--no-sandbox)/' "$SQUASHFS_DIR/AppRun"

OFFSET=$("$APPIMAGE" --appimage-offset)

dd if="$APPIMAGE" of="$RUNTIME" bs=1 count="$OFFSET" status=none

mksquashfs "$SQUASHFS_DIR" "$SQUASHFS" -comp xz -noappend -root-owned > /dev/null 2>&1

cat "$RUNTIME" "$SQUASHFS" > "$APPIMAGE"
chmod +x "$APPIMAGE"

rm -rf "$SQUASHFS_DIR" "$RUNTIME" "$SQUASHFS"

echo "==> Done — AppRun patched"
