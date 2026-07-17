# PartyPad

A cross-platform web-based gamepad controller that allows you to use your phone or tablet as a game controller on Windows and Linux. Works with Steam Deck in game mode.

## Features

- Cross-platform support for Windows and Linux (SteamOS/Arch)
- Connect up to 4 controllers simultaneously
- Full Xbox controller emulation (buttons, thumbsticks, triggers, D-pad)
- Dual thumbstick support with diagonal movement
- QR code display for easy phone connection
- Headless mode for Steam Deck game mode / background use
- Configurable via config file or CLI flags
- One-command Linux installer

## Quick Start

### Linux (including Steam Deck)

```bash
./install.sh
python app.py
```

### Windows

1. Install [ViGEmBus](https://github.com/ViGEm/ViGEmBus/releases)
2. `pip install -r requirements.txt`
3. `python app.py`

Then open the displayed URL on your phone.

## Configuration

Edit `config.json` or use CLI flags:

```bash
python app.py --port 8080 --headless --max-players 6
```

| Config key | CLI flag | Default | Description |
|---|---|---|---|
| `host` | `--host` | `0.0.0.0` | Bind address |
| `port` | `--port` | `8000` | Server port |
| `max_players` | `--max-players` | `4` | Max simultaneous controllers |
| `headless` | `--headless` | `false` | Run without Tkinter GUI window |

## Steam Deck Game Mode

1. Run `./install.sh` to set up dependencies
2. In desktop mode, open Steam
3. Add a Non-Steam Game: `Games > Add a Non-Steam Game to My Library > Browse`
4. Set file type to "All Files" and select `partypad-game.sh`
5. Return to game mode
6. Launch PartyPad from Steam
7. Note the URL displayed on screen, open it on phones
8. Press the Steam button, launch your actual game
9. PartyPad runs in the background - phones become controllers

## Controller Layout

- Left/Right Thumbsticks: Full 360 movement with diagonal support
- A/B/X/Y Buttons: Primary actions
- L1/R1 (Bumpers): Secondary actions
- L2/R2 (Triggers): Analog triggers
- Start/Select: Menu controls
- D-pad: Directional input
- Guide/Menu: System menu

## Architecture

```
app.py              - Main server (FastAPI + WebSocket)
gamepad/
  __init__.py       - OS detection + factory
  base.py           - Abstract gamepad interface
  linux.py          - Linux uinput backend
  windows.py        - Windows ViGEmBus backend
static/
  index.html        - Mobile controller web UI
config.json         - Runtime configuration
install.sh          - Linux dependency installer
partypad-game.sh    - Steam Deck game mode launcher
```

## Development

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Troubleshooting

### Linux

- **Permission error**: Run `sudo usermod -a -G input $USER` and log out/in, or use `./install.sh`
- **No /dev/uinput**: Run `sudo modprobe uinput`, or use `./install.sh`
- **Tkinter not found**: `sudo apt-get install python3-tk` (Debian) or `sudo pacman -S tk` (Arch)
- **Can't run outside project folder**: Run from the PartyPad directory, or use the desktop launcher created by `install.sh`

### Windows

- Install [ViGEmBus](https://github.com/ViGEm/ViGEmBus/releases) driver
- Install [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- If WebSocket fails: check firewall isn't blocking port 8000, ensure devices are on same network
- If running in WSL: gamepad emulation won't work (uinput requires real Linux kernel)

## License

MIT - See LICENSE file
