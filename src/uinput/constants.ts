export const O_RDWR = 2;
export const O_NONBLOCK = 2048;

function _IOC(dir: number, type: number, nr: number, size: number): number {
  return (dir << 30) | (type << 8) | (nr << 0) | (size << 16);
}

const _IOC_NONE = 0;
const _IOC_WRITE = 1;
const U = 'U'.charCodeAt(0);

export const UI_SET_EVBIT   = _IOC(_IOC_WRITE, U, 100, 4);
export const UI_SET_KEYBIT  = _IOC(_IOC_WRITE, U, 101, 4);
export const UI_SET_RELBIT  = _IOC(_IOC_WRITE, U, 102, 4);
export const UI_SET_ABSBIT  = _IOC(_IOC_WRITE, U, 103, 4);
export const UI_SET_SWBIT   = _IOC(_IOC_WRITE, U, 104, 4);
export const UI_ABS_SETUP   = _IOC(_IOC_WRITE, U, 4, 28);
export const UI_DEV_SETUP   = _IOC(_IOC_WRITE, U, 3, 92);
export const UI_DEV_CREATE  = _IOC(_IOC_NONE, U, 1, 0);
export const UI_DEV_DESTROY = _IOC(_IOC_NONE, U, 2, 0);

export const EV_SYN = 0x00;
export const EV_KEY = 0x01;
export const EV_REL = 0x02;
export const EV_ABS = 0x03;
export const EV_FF  = 0x15;

export const SYN_REPORT = 0;

export const BTN_SOUTH  = 0x130;
export const BTN_EAST   = 0x131;
export const BTN_NORTH  = 0x133;
export const BTN_WEST   = 0x134;
export const BTN_TL     = 0x136;
export const BTN_TR     = 0x137;
export const BTN_SELECT = 0x13A;
export const BTN_START  = 0x13B;
export const BTN_MODE   = 0x13C;
export const BTN_THUMBL = 0x13D;
export const BTN_THUMBR = 0x13E;

export const ABS_X     = 0x00;
export const ABS_Y     = 0x01;
export const ABS_Z     = 0x02;
export const ABS_RX    = 0x03;
export const ABS_RY    = 0x04;
export const ABS_RZ    = 0x05;
export const ABS_HAT0X = 0x10;
export const ABS_HAT0Y = 0x11;

export const BUS_USB = 0x03;

export const ALL_BUTTONS = [
  BTN_SOUTH, BTN_EAST, BTN_NORTH, BTN_WEST,
  BTN_TL, BTN_TR,
  BTN_SELECT, BTN_START, BTN_MODE,
  BTN_THUMBL, BTN_THUMBR,
];

export const ALL_AXES = [
  ABS_X, ABS_Y, ABS_RX, ABS_RY,
  ABS_Z, ABS_RZ,
  ABS_HAT0X, ABS_HAT0Y,
];

export const STICK_AXES = [ABS_X, ABS_Y, ABS_RX, ABS_RY] as const;
export const TRIGGER_AXES = [ABS_Z, ABS_RZ] as const;
export const DPAD_AXES = [ABS_HAT0X, ABS_HAT0Y] as const;

export const STICK_MAX = 32767;
export const STICK_CENTER = 16384;
export const TRIGGER_MAX = 255;
export const DPAD_MAX = 1;
export const DPAD_MIN = -1;
