from abc import ABC, abstractmethod

class GamepadInterface(ABC):
    @abstractmethod
    def __init__(self):
        pass

    @abstractmethod
    def press_button(self, button):
        pass

    @abstractmethod
    def release_button(self, button):
        pass

    @abstractmethod
    def left_joystick(self, x_value: int = 0, y_value: int = 0):
        pass

    @abstractmethod
    def right_joystick(self, x_value: int = 0, y_value: int = 0):
        pass

    @abstractmethod
    def left_trigger(self, value: int = 0):
        pass

    @abstractmethod
    def right_trigger(self, value: int = 0):
        pass

    @abstractmethod
    def update(self):
        pass

    @abstractmethod
    def reset(self):
        pass
