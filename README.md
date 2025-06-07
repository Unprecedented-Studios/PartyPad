# PartyPad

A cross-platform web-based gamepad controller that allows you to use your phone or tablet as a game controller on Windows and Linux.  Mostly vibe-coded so use at your own risk.

## Features

- Cross-platform support for Windows and Linux (SteamOS/Arch)
- Connect up to 4 controllers simultaneously
- Full Xbox controller emulation
- Dual thumbstick support with diagonal movement
- Complete button support (A, B, X, Y, triggers, bumpers, etc.)
- Admin interface with QR code for easy connection
- Real-time controller status monitoring
- Reset functionality for all controllers

## Requirements

- Python 3.8 or higher
- Windows 10/11 or Linux (Ubuntu 20.04+, Arch, SteamOS)
- Modern web browser on your phone/tablet
- Local network connection between your computer and phone/tablet

## Installation

### Windows

1. Install ViGEmBus driver (required for virtual controller support):
   - Download the latest version from [ViGEmBus releases](https://github.com/ViGEm/ViGEmBus/releases)
   - Run the installer (.msi file)
   - Restart your computer after installation

2. Install the required Python packages:
```powershell
pip install -r requirements.txt
```

### Linux (including SteamOS/Arch)

**Important Note**: This application has only been successfully tested running within Visual Studio Code on Linux. Standalone execution may not work properly.

1. Install system dependencies:

```bash
# Arch Linux / SteamOS
sudo pacman -S python-pip python-uinput

# Ubuntu/Debian
sudo apt-get install python3-pip python3-uinput
```

2. Add your user to the input group (required for controller emulation):
```bash
sudo usermod -a -G input $USER
```
**Important**: You'll need to log out and log back in for the group changes to take effect.

3. Install Python requirements:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the application:
```bash
python app.py
```

2. A window will appear with a QR code and IP address
3. Scan the QR code with your phone/tablet or enter the IP address in your browser
4. Connect up to 4 controllers simultaneously

## Controller Layout

- Left/Right Thumbsticks: Full 360° movement with diagonal support
- A/B/X/Y Buttons: Primary actions
- L1/R1 (Bumpers): Secondary actions
- L2/R2 (Triggers): Analog triggers
- Start/Select: Menu controls
- D-pad: Directional input
- Guide Button: System menu

## Development

The application uses a modular architecture for cross-platform support:
- `gamepad/` - Contains platform-specific implementations
  - `windows.py` - Windows implementation using vgamepad
  - `linux.py` - Linux implementation using python-uinput
  - `base.py` - Abstract interface definition
  - `factory.py` - Platform detection and implementation selection

## Troubleshooting

### Linux
- If you get a permission error:
  1. Verify user is in input group: `groups $USER`
  2. If not listed, add user and reboot: `sudo usermod -a -G input $USER`
  3. Load uinput module: `sudo modprobe uinput`
  4. Make uinput load at boot: `echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf`
- If the application crashes or fails to start:
  1. Check Python version: `python3 --version` (should be 3.8+)
  2. Verify uinput installation: `ls /dev/uinput`
  3. Try running with sudo (for troubleshooting only): `sudo python3 app.py`
  4. Check system logs: `journalctl -xe`
- If running outside VS Code:
  1. Install additional dependencies: `sudo apt-get install python3-tk python3-pil python3-pil.imagetk`
  2. Run from terminal, not desktop shortcut

### Windows
- Install the latest [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- If ViGEmBus installation fails:
  1. Make sure Windows is fully up to date
  2. Try running the installer as administrator
  3. Check Device Manager for any error indicators
- If controller input isn't working:
  1. Run the application as administrator
  2. Check Task Manager -> Services -> "ViGEmBus" service is running
  3. Try uninstalling and reinstalling ViGEmBus
- If the WebSocket connection fails:
  1. Check if your firewall is blocking port 8000
  2. Ensure your phone and computer are on the same network
  3. Try disabling your VPN if you're using one

## Building from Source

### Windows

1. Install development dependencies:
```powershell
pip install -r requirements.txt
```

2. Build the executable:
```powershell
pyinstaller --name partypad --windowed --icon=static/icon.ico --add-data "static;static" app.py
```

The executable will be created in `dist/partypad/partypad.exe`

### Linux

Currently, the application must be run from source on Linux systems. We're working on creating distribution packages for various Linux distributions.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests (when available)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

1. Clone the repository
2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
3. Install development dependencies:
```bash
pip install -r requirements.txt
```

### Code Style

- Follow PEP 8 guidelines
- Use type hints where possible
- Keep functions small and focused
- Add docstrings for public interfaces
- Comment complex algorithms

### Testing

(Coming Soon) We plan to add unit tests and integration tests using pytest.
