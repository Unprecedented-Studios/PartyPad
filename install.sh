#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "  PartyPad v2.0 - Installer"
echo "========================================="
echo ""

# --- Detect SteamOS ---
IS_STEAMOS=false
if grep -qi "steamos" /etc/os-release 2>/dev/null; then
  IS_STEAMOS=true
fi

if $IS_STEAMOS; then
  echo -e "${YELLOW}=========================================${NC}"
  echo -e "${YELLOW}  SteamOS detected!${NC}"
  echo ""
  echo "  The Steam Deck filesystem is read-only by default."
  echo "  System changes (modprobe, udev, groups) will fail"
  echo "  unless you unlock the filesystem first:"
  echo ""
  echo -e "    ${GREEN}sudo steamos-readonly disable${NC}"
  echo -e "    ${GREEN}sudo pacman-key --init${NC}"
  echo -e "    ${GREEN}sudo pacman-key --populate archlinux${NC}"
  echo ""
  read -p "  Press Enter to continue (or Ctrl+C to abort)... "
  echo ""
fi

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
  echo -e "${RED}Error: Node.js is not installed.${NC}"
  echo "Install Node.js: https://nodejs.org/"
  exit 1
fi

echo -e "Node.js: $(node --version)"
echo -e "npm:     $(npm --version)"
echo ""

# --- Install npm dependencies ---
echo "Installing npm dependencies..."
cd "$SCRIPT_DIR"
npm install
echo -e "${GREEN}Dependencies installed.${NC}"
echo ""

# --- Build TypeScript ---
echo "Building TypeScript..."
npx tsc 2>&1 || {
  echo -e "${RED}TypeScript compilation failed.${NC}"
  exit 1
}
echo -e "${GREEN}Build complete.${NC}"
echo ""

# --- Check assets ---
if [ ! -f "$SCRIPT_DIR/static/icon.png" ]; then
  echo -e "${YELLOW}Warning: static/icon.png not found. Desktop shortcut will have no icon.${NC}"
fi

# --- Uinput setup ---
echo "Setting up uinput..."

if ! lsmod | grep -q uinput; then
  echo "Loading uinput kernel module..."
  sudo modprobe uinput 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not load uinput module.${NC}"
    if $IS_STEAMOS; then
      echo "On SteamOS, make sure you've run: sudo steamos-readonly disable"
    fi
  }
fi

if [ ! -f /etc/modules-load.d/uinput.conf ]; then
  echo "Configuring uinput to load at boot..."
  echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf > /dev/null || {
    echo -e "${YELLOW}Failed to write /etc/modules-load.d/uinput.conf${NC}"
    if $IS_STEAMOS; then
      echo "Run: sudo steamos-readonly disable"
    fi
    echo "You can load uinput manually at boot: sudo modprobe uinput"
  }
  echo -e "${GREEN}uinput configured for autoload.${NC}"
fi

# --- udev rules ---
if [ ! -f /etc/udev/rules.d/99-uinput.rules ]; then
  echo "Creating udev rule for /dev/uinput..."
  echo 'KERNEL=="uinput", GROUP="input", MODE="0660"' | sudo tee /etc/udev/rules.d/99-uinput.rules > /dev/null || {
    echo -e "${YELLOW}Failed to write /etc/udev/rules.d/99-uinput.rules${NC}"
    if $IS_STEAMOS; then
      echo "Run: sudo steamos-readonly disable"
    fi
  }
  sudo udevadm control --reload-rules 2>/dev/null || true
  sudo udevadm trigger 2>/dev/null || true
  echo -e "${GREEN}udev rule created.${NC}"
fi

# --- Input group ---
if ! groups "$USER" | grep -q input; then
  echo "Adding user to input group..."
  sudo usermod -a -G input "$USER" 2>/dev/null || {
    echo -e "${YELLOW}Failed to add user to input group.${NC}"
    echo "You may need to run manually: sudo usermod -a -G input $USER"
  }
  echo ""
  echo -e "${YELLOW}=========================================${NC}"
  echo -e "${YELLOW}  IMPORTANT:${NC}"
  echo -e "${YELLOW}  You MUST reboot (or log out and back in)${NC}"
  echo -e "${YELLOW}  for the input group to take effect.${NC}"
  echo -e "${YELLOW}  Without this, PartyPad cannot create virtual gamepads.${NC}"
  echo -e "${YELLOW}=========================================${NC}"
  echo ""
else
  echo -e "${GREEN}User is already in input group.${NC}"
fi
echo ""

# --- .desktop file ---
DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/partypad.desktop"

if [ ! -d "$DESKTOP_DIR" ]; then
  mkdir -p "$DESKTOP_DIR"
fi

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=PartyPad
Comment=Web-based virtual game controller server
Exec=$SCRIPT_DIR/partypad-game.sh
Path=$SCRIPT_DIR
Icon=$SCRIPT_DIR/static/icon.png
Terminal=true
Type=Application
Categories=Game;
EOF

chmod +x "$SCRIPT_DIR/partypad-game.sh"
echo -e "${GREEN}Desktop shortcut created.${NC}"
echo ""

# --- Done ---
IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")
PORT=$(node -e "try{console.log(require('$SCRIPT_DIR/config.json').port||8000)}catch(e){console.log(8000)}" 2>/dev/null || echo 8000)

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  PartyPad installation complete!${NC}"
echo ""
echo "  Phones connect to: http://$IP:$PORT"
echo ""
echo "  Launch options:"
echo "    - Desktop: Run 'PartyPad' from your app menu"
echo "    - Terminal: $SCRIPT_DIR/partypad-game.sh"
echo "    - Steam: Add partypad-game.sh as non-Steam game"
echo ""
if ! groups "$USER" | grep -q input; then
  echo -e "  ${YELLOW}!! REBOOT REQUIRED: input group change not yet active${NC}"
  echo -e "  ${YELLOW}!! PartyPad will not work until you reboot.${NC}"
  echo ""
fi
echo -e "${GREEN}=========================================${NC}"
