#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

read_port() {
  if [ -f "$SCRIPT_DIR/config.json" ]; then
    node -e "try{console.log(require('$SCRIPT_DIR/config.json').port||8000)}catch(e){console.log(8000)}" 2>/dev/null || echo 8000
  else
    echo 8000
  fi
}

get_ip() {
  ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || echo "localhost"
}

PORT=$(read_port)
IP=$(get_ip)
URL="http://$IP:$PORT"

echo ""
echo "  URL: $URL"
echo "=================================="
echo "  PartyPad - Game Mode"
echo "  Open the URL above on phones"
echo "  Press Ctrl+C to stop"
echo "=================================="
echo ""

# Ensure uinput module is loaded
if ! lsmod | grep -q uinput; then
  sudo modprobe uinput 2>/dev/null || true
fi

exec "$SCRIPT_DIR/node_modules/.bin/electron" "$SCRIPT_DIR/dist/main.js" --port "$PORT"
