#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Find Python ---
PYTHON=""
for py in python3 python; do
    if command -v "$py" &>/dev/null; then
        PYTHON="$py"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo -e "${RED}Error: python3 not found${NC}"
    exit 1
fi

# --- Check and install deps ---
echo "Checking dependencies..."
if ! "$PYTHON" -c "import fastapi" 2>/dev/null; then
    echo "Dependencies not installed. Installing..."
    cd "$SCRIPT_DIR"

    PIP_CMD="$PYTHON -m pip install --quiet"

    # Try --user first, fall back to system, try --break-system-packages as last resort
    if $PIP_CMD --user fastapi uvicorn python-multipart pillow qrcode websockets 2>/dev/null; then
        echo "Installed (user)"
    elif $PIP_CMD fastapi uvicorn python-multipart pillow qrcode websockets 2>/dev/null; then
        echo "Installed (system)"
    else
        echo -e "${YELLOW}Trying --break-system-packages...${NC}"
        $PIP_CMD --break-system-packages fastapi uvicorn python-multipart pillow qrcode websockets
        echo "Installed (--break-system-packages)"
    fi

    # Platform-specific: python-uinput on Linux
    if ! "$PYTHON" -c "import uinput" 2>/dev/null; then
        echo "Installing python-uinput..."
        $PIP_CMD --user python-uinput 2>/dev/null || \
            $PIP_CMD python-uinput 2>/dev/null || \
            $PIP_CMD --break-system-packages python-uinput 2>/dev/null || \
            echo -e "${YELLOW}Warning: python-uinput install failed. Controller emulation may not work.${NC}"
    fi

    echo ""
fi

# --- Show URL ---
cd "$SCRIPT_DIR"
if [ -f "$SCRIPT_DIR/config.json" ]; then
    PORT=$("$PYTHON" -c "import json; print(json.load(open('$SCRIPT_DIR/config.json')).get('port', 8000))" 2>/dev/null || echo "8000")
else
    PORT=8000
fi

URL=$("$PYTHON" -c "
import socket
def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return 'localhost'
print(f'http://{get_ip()}:$PORT')
" 2>/dev/null || echo "http://localhost:$PORT")

echo ""
echo "  URL: $URL"
echo "=================================="
echo "  PartyPad - Game Mode"
echo "  Open the URL above on phones"
echo "  Press Ctrl+C to stop"
echo "=================================="
echo ""

exec "$PYTHON" app.py --headless
