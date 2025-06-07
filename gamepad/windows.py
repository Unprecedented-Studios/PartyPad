from .base import GamepadInterface

try:
    import vgamepad as vg
except ImportError:
    vg = None

class XUSB_BUTTON:
    XUSB_GAMEPAD_A = vg.XUSB_BUTTON.XUSB_GAMEPAD_A
    XUSB_GAMEPAD_B = vg.XUSB_BUTTON.XUSB_GAMEPAD_B
    XUSB_GAMEPAD_X = vg.XUSB_BUTTON.XUSB_GAMEPAD_X
    XUSB_GAMEPAD_Y = vg.XUSB_BUTTON.XUSB_GAMEPAD_Y
    XUSB_GAMEPAD_START = vg.XUSB_BUTTON.XUSB_GAMEPAD_START
    XUSB_GAMEPAD_BACK = vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK
    XUSB_GAMEPAD_LEFT_THUMB = vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB
    XUSB_GAMEPAD_RIGHT_THUMB = vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB
    XUSB_GAMEPAD_LEFT_SHOULDER = vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER
    XUSB_GAMEPAD_RIGHT_SHOULDER = vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER
    XUSB_GAMEPAD_GUIDE = vg.XUSB_BUTTON.XUSB_GAMEPAD_GUIDE
    XUSB_GAMEPAD_DPAD_UP = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP
    XUSB_GAMEPAD_DPAD_DOWN = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN
    XUSB_GAMEPAD_DPAD_LEFT = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT
    XUSB_GAMEPAD_DPAD_RIGHT = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT

class XUSB_BUTTON:
    # Define button constants that match vgamepad's
    if vg:
        XUSB_GAMEPAD_A = vg.XUSB_BUTTON.XUSB_GAMEPAD_A
        XUSB_GAMEPAD_B = vg.XUSB_BUTTON.XUSB_GAMEPAD_B
        XUSB_GAMEPAD_X = vg.XUSB_BUTTON.XUSB_GAMEPAD_X
        XUSB_GAMEPAD_Y = vg.XUSB_BUTTON.XUSB_GAMEPAD_Y
        XUSB_GAMEPAD_START = vg.XUSB_BUTTON.XUSB_GAMEPAD_START
        XUSB_GAMEPAD_BACK = vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK
        XUSB_GAMEPAD_LEFT_THUMB = vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB
        XUSB_GAMEPAD_RIGHT_THUMB = vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB
        XUSB_GAMEPAD_LEFT_SHOULDER = vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER
        XUSB_GAMEPAD_RIGHT_SHOULDER = vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER
        XUSB_GAMEPAD_GUIDE = vg.XUSB_BUTTON.XUSB_GAMEPAD_GUIDE
        XUSB_GAMEPAD_DPAD_UP = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP
        XUSB_GAMEPAD_DPAD_DOWN = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN
        XUSB_GAMEPAD_DPAD_LEFT = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT
        XUSB_GAMEPAD_DPAD_RIGHT = vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT

class WindowsGamepad(GamepadInterface):
    XUSB_BUTTON = XUSB_BUTTON
    
    def __init__(self):
        if not vg:
            raise ImportError(
                "vgamepad module is not installed. Please install it using:\n"
                "pip install vgamepad"
            )
        self.gamepad = vg.VX360Gamepad()

    def press_button(self, button):
        self.gamepad.press_button(button=button)

    def release_button(self, button):
        self.gamepad.release_button(button=button)

    def left_joystick(self, x_value: int = 0, y_value: int = 0):
        self.gamepad.left_joystick(x_value=x_value, y_value=y_value)

    def right_joystick(self, x_value: int = 0, y_value: int = 0):
        self.gamepad.right_joystick(x_value=x_value, y_value=y_value)

    def left_trigger(self, value: int = 0):
        self.gamepad.left_trigger(value=value)

    def right_trigger(self, value: int = 0):
        self.gamepad.right_trigger(value=value)

    def update(self):
        self.gamepad.update()

    def reset(self):
        self.gamepad.reset()
        self.update()
