import uinput
import time
from .base import GamepadInterface

# Define button and axis events
EVENTS = (
    uinput.BTN_A,
    uinput.BTN_B,
    uinput.BTN_X,
    uinput.BTN_Y,
    uinput.BTN_START,
    uinput.BTN_SELECT,
    uinput.BTN_THUMBL,
    uinput.BTN_THUMBR,
    uinput.BTN_TL,
    uinput.BTN_TR,
    uinput.BTN_MODE,
    uinput.ABS_X + (0, 32767, 0, 0),  # Left stick X
    uinput.ABS_Y + (0, 32767, 0, 0),  # Left stick Y
    uinput.ABS_RX + (0, 32767, 0, 0), # Right stick X
    uinput.ABS_RY + (0, 32767, 0, 0), # Right stick Y
    uinput.ABS_Z + (0, 255, 0, 0),    # Left trigger
    uinput.ABS_RZ + (0, 255, 0, 0),   # Right trigger
    uinput.ABS_HAT0X + (-1, 1, 0, 0), # D-pad X
    uinput.ABS_HAT0Y + (-1, 1, 0, 0), # D-pad Y
)

class LinuxGamepad(GamepadInterface):
    def __init__(self):
        try:
            self.device = uinput.Device(EVENTS, name="Virtual Xbox Controller")
            # Small delay to ensure device is fully initialized
            time.sleep(0.1)
        except PermissionError:
            raise PermissionError(
                "Failed to create gamepad device. Make sure you have the required permissions. "
                "You need to either:\n"
                "1. Run the application as root (not recommended)\n"
                "2. Add your user to the 'input' group with: sudo usermod -a -G input $USER\n"
                "   Then log out and log back in for the changes to take effect."
            )

    def _button_event(self, button, value):
        self.device.emit(button, value)

    def press_button(self, button):
        # Map vgamepad button constants to uinput constants
        button_map = {
            "XUSB_GAMEPAD_A": uinput.BTN_A,
            "XUSB_GAMEPAD_B": uinput.BTN_B,
            "XUSB_GAMEPAD_X": uinput.BTN_X,
            "XUSB_GAMEPAD_Y": uinput.BTN_Y,
            "XUSB_GAMEPAD_START": uinput.BTN_START,
            "XUSB_GAMEPAD_BACK": uinput.BTN_SELECT,
            "XUSB_GAMEPAD_LEFT_THUMB": uinput.BTN_THUMBL,
            "XUSB_GAMEPAD_RIGHT_THUMB": uinput.BTN_THUMBR,
            "XUSB_GAMEPAD_LEFT_SHOULDER": uinput.BTN_TL,
            "XUSB_GAMEPAD_RIGHT_SHOULDER": uinput.BTN_TR,
            "XUSB_GAMEPAD_GUIDE": uinput.BTN_MODE,
        }
        # D-pad handling
        dpad_map = {
            "XUSB_GAMEPAD_DPAD_UP": (uinput.ABS_HAT0Y, -1),
            "XUSB_GAMEPAD_DPAD_DOWN": (uinput.ABS_HAT0Y, 1),
            "XUSB_GAMEPAD_DPAD_LEFT": (uinput.ABS_HAT0X, -1),
            "XUSB_GAMEPAD_DPAD_RIGHT": (uinput.ABS_HAT0X, 1),
        }

        button_name = button.name if hasattr(button, 'name') else str(button)
        
        if button_name in button_map:
            self._button_event(button_map[button_name], 1)
        elif button_name in dpad_map:
            event, value = dpad_map[button_name]
            self.device.emit(event, value)

    def release_button(self, button):
        button_map = {
            "XUSB_GAMEPAD_A": uinput.BTN_A,
            "XUSB_GAMEPAD_B": uinput.BTN_B,
            "XUSB_GAMEPAD_X": uinput.BTN_X,
            "XUSB_GAMEPAD_Y": uinput.BTN_Y,
            "XUSB_GAMEPAD_START": uinput.BTN_START,
            "XUSB_GAMEPAD_BACK": uinput.BTN_SELECT,
            "XUSB_GAMEPAD_LEFT_THUMB": uinput.BTN_THUMBL,
            "XUSB_GAMEPAD_RIGHT_THUMB": uinput.BTN_THUMBR,
            "XUSB_GAMEPAD_LEFT_SHOULDER": uinput.BTN_TL,
            "XUSB_GAMEPAD_RIGHT_SHOULDER": uinput.BTN_TR,
            "XUSB_GAMEPAD_GUIDE": uinput.BTN_MODE,
        }
        # D-pad handling
        dpad_map = {
            "XUSB_GAMEPAD_DPAD_UP": uinput.ABS_HAT0Y,
            "XUSB_GAMEPAD_DPAD_DOWN": uinput.ABS_HAT0Y,
            "XUSB_GAMEPAD_DPAD_LEFT": uinput.ABS_HAT0X,
            "XUSB_GAMEPAD_DPAD_RIGHT": uinput.ABS_HAT0X,
        }

        button_name = button.name if hasattr(button, 'name') else str(button)
        
        if button_name in button_map:
            self._button_event(button_map[button_name], 0)
        elif button_name in dpad_map:
            self.device.emit(dpad_map[button_name], 0)

    def left_joystick(self, x_value: int = 0, y_value: int = 0):
        # Convert from vgamepad range (-32768 to 32767) to uinput range (0 to 32767)
        # Invert Y axis to match expected behavior
        x = (x_value + 32768) // 2
        y = (-y_value + 32768) // 2  # Invert Y by negating the input value
        self.device.emit(uinput.ABS_X, x)
        self.device.emit(uinput.ABS_Y, y)

    def right_joystick(self, x_value: int = 0, y_value: int = 0):
        x = (x_value + 32768) // 2
        y = (-y_value + 32768) // 2  # Invert Y by negating the input value
        self.device.emit(uinput.ABS_RX, x)
        self.device.emit(uinput.ABS_RY, y)

    def left_trigger(self, value: int = 0):
        self.device.emit(uinput.ABS_Z, value)

    def right_trigger(self, value: int = 0):
        self.device.emit(uinput.ABS_RZ, value)

    def update(self):
        # uinput updates immediately, so this is a no-op
        pass

    def reset(self):
        # Reset all buttons and axes to default state
        for btn in [uinput.BTN_A, uinput.BTN_B, uinput.BTN_X, uinput.BTN_Y,
                   uinput.BTN_START, uinput.BTN_SELECT, uinput.BTN_THUMBL,
                   uinput.BTN_THUMBR, uinput.BTN_TL, uinput.BTN_TR, uinput.BTN_MODE]:
            self._button_event(btn, 0)
        
        # Reset sticks and triggers
        self.left_joystick(0, 0)
        self.right_joystick(0, 0)
        self.left_trigger(0)
        self.right_trigger(0)
        
        # Reset D-pad
        self.device.emit(uinput.ABS_HAT0X, 0)
        self.device.emit(uinput.ABS_HAT0Y, 0)
