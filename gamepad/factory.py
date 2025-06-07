import platform

def create_gamepad():
    """
    Factory function to create the appropriate gamepad implementation
    based on the current operating system.
    """
    system = platform.system().lower()
    
    if system == 'windows':
        from .windows import WindowsGamepad
        return WindowsGamepad()
    elif system == 'linux':
        from .linux import LinuxGamepad
        return LinuxGamepad()
    else:
        raise NotImplementedError(f"Gamepad emulation not implemented for {system}")
