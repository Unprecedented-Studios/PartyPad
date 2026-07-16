# PyInstaller build script for PartyPad
# Usage: pip install pyinstaller && python build.py

import PyInstaller.__main__
import sys
import os
import shutil

APP_NAME = "partypad"
SEPARATOR = ";" if sys.platform == "win32" else ":"

# Ensure clean build
if os.path.exists("build"):
    shutil.rmtree("build")
if os.path.exists("dist"):
    for item in os.listdir("dist"):
        path = os.path.join("dist", item)
        if os.path.isfile(path):
            os.remove(path)

args = [
    "app.py",
    "--name", APP_NAME,
    "--add-data", f"static{SEPARATOR}static",
    "--add-data", f"config.json{SEPARATOR}.",
    "--add-data", f"gamepad{SEPARATOR}gamepad",
]

if sys.platform == "win32":
    args.append("--windowed")
    args.append("--hidden-import=vgamepad")
    args.append("--hidden-import=vgamepad.win.vigem")
else:
    args.append("--hidden-import=uinput")

args.append("--noconfirm")

PyInstaller.__main__.run(args)

print(f"\nBuild complete: dist/{APP_NAME}/")
if sys.platform == "win32":
    print(f"Executable: dist/{APP_NAME}/{APP_NAME}.exe")
else:
    print(f"Executable: dist/{APP_NAME}/{APP_NAME}")
