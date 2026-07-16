#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== PartyPad Installer ===${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Detect distro ---
if [ -f /etc/arch-release ] || grep -qi "steamos" /etc/os-release 2>/dev/null; then
    DISTRO="arch"
    echo "Detected Arch Linux / SteamOS"
elif grep -qi "fedora" /etc/os-release 2>/dev/null; then
    DISTRO="fedora"
    echo "Detected Fedora"
elif grep -qi 'rhel\|centos\|rocky\|almalinux' /etc/os-release 2>/dev/null; then
    DISTRO="fedora"
    echo "Detected RHEL/CentOS (using dnf package names)"
elif [ -f /etc/debian_version ]; then
    DISTRO="debian"
    echo "Detected Debian / Ubuntu"
else
    echo -e "${YELLOW}Unknown distro. Assuming Debian/Ubuntu-style packages.${NC}"
    DISTRO="debian"
fi

# --- Check Python ---
echo ""
echo -n "Checking Python version... "
PYTHON=""
for py in python3 python; do
    if command -v "$py" &>/dev/null; then
        ver=$("$py" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        major=$("$py" -c "import sys; print(sys.version_info.major)")
        minor=$("$py" -c "import sys; print(sys.version_info.minor)")
        if [ "$major" -ge 3 ] && [ "$minor" -ge 8 ]; then
            PYTHON="$py"
            echo -e "${GREEN}$ver ($py)${NC}"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo -e "${RED}Python 3.8+ not found. Please install Python 3.8 or newer.${NC}"
    exit 1
fi

# --- Install system packages ---
echo ""
echo "Installing system dependencies..."

if [ "$DISTRO" = "arch" ]; then
    echo "Running: sudo pacman -S --needed python-pip tk"
    sudo pacman -S --needed python-pip tk 2>/dev/null || {
        echo -e "${YELLOW}pacman install may have failed. If steamdeck, you may need to unlock the filesystem first:${NC}"
        echo "  sudo steamos-readonly disable"
        echo "  sudo pacman-key --init"
        echo "  sudo pacman-key --populate archlinux"
        echo "  sudo pacman -S --needed python-pip tk"
    }

    # python-uinput can be installed via pip since it's in requirements.txt
    # But it may need kernel headers to compile
    echo "Installing kernel headers (needed for python-uinput)..."
    sudo pacman -S --needed linux-headers 2>/dev/null || {
        echo -e "${YELLOW}Kernel headers not available. Will try pip install anyway.${NC}"
    }

elif [ "$DISTRO" = "debian" ]; then
    echo "Running: sudo apt-get install -y python3-pip python3-tk python3-pil.imagetk python3-dev"
    sudo apt-get update -qq
    sudo apt-get install -y python3-pip python3-tk python3-pil.imagetk python3-dev

elif [ "$DISTRO" = "fedora" ]; then
    echo "Running: sudo dnf install -y python3-pip python3-tkinter python3-pillow-tk python3-devel"
    sudo dnf install -y python3-pip python3-tkinter python3-pillow-tk python3-devel

    echo "Installing kernel headers (needed for python-uinput)..."
    sudo dnf install -y kernel-devel 2>/dev/null || \
        echo -e "${YELLOW}Kernel headers not available. Will try pip install anyway.${NC}"
fi

# --- Install Python packages ---
echo ""
echo "Installing Python packages from requirements.txt..."
cd "$SCRIPT_DIR"
# Try user install first, then system, then --break-system-packages for distros like Fedora
if "$PYTHON" -m pip install --user -r requirements.txt 2>/dev/null; then
    echo "Installed Python packages (user)"
elif "$PYTHON" -m pip install -r requirements.txt 2>/dev/null; then
    echo "Installed Python packages (system)"
else
    echo -e "${YELLOW}Standard install failed. Trying --break-system-packages...${NC}"
    "$PYTHON" -m pip install --break-system-packages -r requirements.txt
    echo "Installed Python packages (--break-system-packages)"
fi

# --- Setup uinput ---
echo ""
echo "Setting up uinput kernel module..."
if ! lsmod | grep -q uinput; then
    sudo modprobe uinput
    echo "uinput module loaded."
else
    echo "uinput module already loaded."
fi

# Autoload uinput at boot
UINPUT_CONF="/etc/modules-load.d/uinput.conf"
if [ ! -f "$UINPUT_CONF" ]; then
    echo "uinput" | sudo tee "$UINPUT_CONF" > /dev/null
    echo "uinput set to load at boot."
else
    echo "uinput already configured for autoload."
fi

# --- udev rule for /dev/uinput ---
echo ""
echo "Creating udev rule for /dev/uinput..."
UDEV_RULE="/etc/udev/rules.d/99-uinput.rules"
if [ ! -f "$UDEV_RULE" ]; then
    echo 'KERNEL=="uinput", MODE="0660", GROUP="input"' | sudo tee "$UDEV_RULE" > /dev/null
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    echo "udev rule created."
else
    echo "udev rule already exists."
fi

# --- Add user to input group ---
echo ""
if groups "$USER" | grep -q "\binput\b"; then
    echo "User $USER is already in the input group."
else
    echo "Adding user $USER to the input group..."
    sudo usermod -a -G input "$USER"
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}IMPORTANT: You must log out and log back${NC}"
    echo -e "${YELLOW}in for the group change to take effect.${NC}"
    echo -e "${YELLOW}A reboot also works.${NC}"
    echo -e "${YELLOW}========================================${NC}"
    NEEDS_RELOGIN=1
fi

# --- Create .desktop file ---
echo ""
echo "Creating .desktop launcher..."
DESKTOP_FILE="$HOME/.local/share/applications/partypad.desktop"
mkdir -p "$HOME/.local/share/applications"
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=PartyPad
Comment=Web-based game controller server
Exec=$PYTHON $SCRIPT_DIR/app.py
Path=$SCRIPT_DIR
Type=Application
Categories=Game;Utility;
Terminal=false
EOF
chmod +x "$DESKTOP_FILE"
echo "Desktop launcher created: $DESKTOP_FILE"

# --- Done ---
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  PartyPad installation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To run PartyPad:"
echo "  cd $SCRIPT_DIR && $PYTHON app.py"
echo ""
echo "Or find PartyPad in your application menu."
echo "For Steam Deck game mode, see: $SCRIPT_DIR/partypad-game.sh"
echo ""

if [ -n "${NEEDS_RELOGIN:-}" ]; then
    echo -e "${YELLOW}Reminder: log out and back in for input group changes.${NC}"
fi
