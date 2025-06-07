from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import platform
import asyncio
import json
import tkinter as tk
from tkinter import ttk
import qrcode
from PIL import Image, ImageTk
import socket
import threading

from gamepad import create_gamepad

# Simple button mapping that both platforms will understand
class GamepadButton:
    def __init__(self, name):
        self.name = name

# Platform-agnostic button mapping
BUTTON_MAP = {
    'A': GamepadButton('XUSB_GAMEPAD_A'),
    'B': GamepadButton('XUSB_GAMEPAD_B'),
    'X': GamepadButton('XUSB_GAMEPAD_X'),
    'Y': GamepadButton('XUSB_GAMEPAD_Y'),
    'START': GamepadButton('XUSB_GAMEPAD_START'),
    'SELECT': GamepadButton('XUSB_GAMEPAD_BACK'),
    'L2': GamepadButton('XUSB_GAMEPAD_LEFT_SHOULDER'),
    'R2': GamepadButton('XUSB_GAMEPAD_RIGHT_SHOULDER'),
    'L3': GamepadButton('XUSB_GAMEPAD_LEFT_THUMB'),
    'R3': GamepadButton('XUSB_GAMEPAD_RIGHT_THUMB'),
    'GUIDE': GamepadButton('XUSB_GAMEPAD_GUIDE'),
    'UP': GamepadButton('XUSB_GAMEPAD_DPAD_UP'),
    'DOWN': GamepadButton('XUSB_GAMEPAD_DPAD_DOWN'),
    'LEFT': GamepadButton('XUSB_GAMEPAD_DPAD_LEFT'),
    'RIGHT': GamepadButton('XUSB_GAMEPAD_DPAD_RIGHT'),
}

class GamepadManager:
    def __init__(self, max_players=4):
        self.max_players = max_players
        self.gamepads = {}
        self.active_players = set()
        self.connections = {}
        self.stick_states = {}
        
    def get_available_player_number(self) -> int:
        for i in range(1, self.max_players + 1):
            if i not in self.active_players:
                return i
        return None
        
    def cleanup_player(self, player_number: int):
        if player_number in self.gamepads:
            try:
                gamepad = self.gamepads[player_number]
                gamepad.reset()
                gamepad.update()
            except:
                pass
            self.gamepads.pop(player_number, None)
            self.active_players.discard(player_number)
            self.stick_states.pop(player_number, None)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
manager = GamepadManager()

@app.get("/")
async def get_root():
    return FileResponse('static/index.html')

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Get next available player number
    player_number = manager.get_available_player_number()
    if player_number is None:
        await websocket.close(code=1000, reason="No available player slots")
        return

    # Initialize gamepad
    if player_number not in manager.gamepads:
        manager.gamepads[player_number] = create_gamepad()
        manager.stick_states[player_number] = {'left': {'x': 0, 'y': 0}, 'right': {'x': 0, 'y': 0}}
    
    manager.connections[websocket] = player_number
    manager.active_players.add(player_number)

    await websocket.send_json({"type": "player_number", "number": player_number})
    
    # Optimize connection
    if hasattr(websocket, '_transport'):
        websocket._transport.set_nodelay(True)
    
    try:
        while True:
            message = await websocket.receive_json()
            if message.get("type") == "input_batch":
                actions = message.get("actions", [])
                gamepad = manager.gamepads[player_number]
                needs_update = False
                
                for action in actions:
                    if 'thumbstick' in action.lower():
                        stick_type = 'right' if 'right-thumbstick' in action.lower() else 'left'
                        x_value = y_value = 0
                        
                        if '-CENTER' not in action:
                            direction = action.upper().split('_')[-1]
                            if 'DLEFT' in direction: x_value = -32767
                            if 'DRIGHT' in direction: x_value = 32767
                            if 'DUP' in direction: y_value = 32767
                            if 'DDOWN' in direction: y_value = -32767
                            
                            if '-' in direction:  # Diagonal
                                x_value = int(x_value * 0.7071)
                                y_value = int(y_value * 0.7071)
                        
                        if stick_type == 'left':
                            gamepad.left_joystick(x_value=x_value, y_value=y_value)
                        else:
                            gamepad.right_joystick(x_value=x_value, y_value=y_value)
                        needs_update = True
                    
                    elif 'BUTTON' in action:
                        parts = action.split('_')
                        button_type = parts[0]
                        is_release = 'RELEASE' in action
                        
                        if 'R1' in button_type or 'L1' in button_type:
                            value = 0 if is_release else 255
                            if 'L1' in button_type:
                                gamepad.left_trigger(value=value)
                            else:
                                gamepad.right_trigger(value=value)
                            needs_update = True
                        elif button_type in BUTTON_MAP:
                            if is_release:
                                gamepad.release_button(button=BUTTON_MAP[button_type])
                            else:
                                gamepad.press_button(button=BUTTON_MAP[button_type])
                            needs_update = True
                    
                if needs_update:
                    gamepad.update()
    
    except WebSocketDisconnect:
        manager.cleanup_player(player_number)
        manager.connections.pop(websocket, None)
    except Exception as e:
        print(f"Error in websocket connection: {str(e)}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass
        finally:
            manager.cleanup_player(player_number)
            manager.connections.pop(websocket, None)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def generate_qr_code(url, size=200):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img = img.resize((size, size))
    return ImageTk.PhotoImage(img)

class ControllerUI:
    def __init__(self, gamepad_manager):
        self.manager = gamepad_manager
        self.root = tk.Tk()
        self.root.title("PartyPad")
        self.root.geometry("400x500")
        
        # Center the window
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - 400) // 2
        y = (screen_height - 500) // 2
        self.root.geometry(f"400x500+{x}+{y}")
        
        style = ttk.Style()
        style.configure("Reset.TButton", padding=10, font=('Helvetica', 12))
        
        # Create main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # IP Address display
        self.ip_address = f"http://{get_local_ip()}:8000"
        ip_label = ttk.Label(main_frame, text="Connect to:", font=('Helvetica', 12))
        ip_label.grid(row=0, column=0, pady=5)
        ip_value = ttk.Label(main_frame, text=self.ip_address, font=('Helvetica', 12, 'bold'))
        ip_value.grid(row=1, column=0, pady=5)
        
        # QR Code
        self.qr_image = generate_qr_code(self.ip_address)
        qr_label = ttk.Label(main_frame, image=self.qr_image)
        qr_label.grid(row=2, column=0, pady=20)
        
        # Reset button
        reset_btn = ttk.Button(main_frame, text="Reset All Controllers", 
                             command=self.reset_controllers, style="Reset.TButton")
        reset_btn.grid(row=3, column=0, pady=20)
        
        # Status label
        self.status_label = ttk.Label(main_frame, text="No controllers connected", 
                                    font=('Helvetica', 10))
        self.status_label.grid(row=4, column=0, pady=10)
        
        # Center everything
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        for i in range(5):
            main_frame.rowconfigure(i, weight=1)
    
    def reset_controllers(self):
        print("Resetting all controllers")
        # Disconnect all websockets first
        connections = list(self.manager.connections.items())  # Make a copy since we'll modify the dict
        for websocket, player_num in connections:
            try:
                # Schedule the websocket close in the asyncio event loop
                asyncio.run_coroutine_threadsafe(
                    websocket.close(code=1000, reason="reset"),
                    asyncio.get_event_loop()
                )
            except:
                pass
            self.manager.cleanup_player(player_num)
            
        self.update_status()
    
    def update_status(self):
        connected = len(self.manager.active_players)
        self.status_label.config(text=f"Connected controllers: {connected}")
    
    def update(self):
        self.update_status()
        self.root.after(1000, self.update)  # Update every second
    
    def start(self):
        self.update()
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def on_closing(self):
        # Clean up all controllers before exit
        for player_num in list(self.manager.active_players):
            self.manager.cleanup_player(player_num)
        self.root.quit()
        # Force stop the program
        import os
        os._exit(0)
    
    def run(self):
        self.start()
        self.root.mainloop()

async def run_server():
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, loop="asyncio")
    server = uvicorn.Server(config)
    await server.serve()

def run_ui():
    ui = ControllerUI(manager)
    ui.run()

if __name__ == "__main__":
    import uvicorn
    import warnings
    
    # Suppress the tracemalloc warning
    warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*Enable tracemalloc.*")
    
    # Start the UI in a separate thread
    ui_thread = threading.Thread(target=run_ui, daemon=True)
    ui_thread.start()
    
    # Run the FastAPI server in the main thread
    asyncio.run(run_server())
